import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test } from '@nestjs/testing';
import { AppEvents } from 'src/common/event/app-events';
import { makeEmptyCrudRequest } from 'src/common/util/crud-request-util';
import { FileOutputService } from 'src/file-output/file-output.service';
import { LineItemAcknowledgementStatusType } from 'src/line-item-acknowledgement/enum/line-item-acknowledgement-status-type.enum';
import { ProductStatusType } from 'src/product/enum/product-status-type.enum';
import { PurchaseOrderAcknowledgement } from 'src/purchase-order-acknowledgement/entities/purchase-order-acknowledgement.entity';
import { PurchaseOrderAcknowledgementService } from 'src/purchase-order-acknowledgement/purchase-order-acknowledgement.service';
import { PurchaseOrder } from 'src/purchase-order/entities/purchase-order.entity';
import { PurchaseOrderService } from 'src/purchase-order/purchase-order.service';
import { MockCrudService } from 'test/src/common/service/mock-crud.service';
import { MockEventEmitter } from 'test/src/common/service/mock-event-emitter.service';
import { MockFileOutputService } from 'test/src/common/service/mock-file-output.service';
import { OrderItemsMexal } from './entities/order-items-mexal.entity';
import { OrderItemsMexalStatusType } from './enum/order-item-mexal-status-type.enum';
import { OrderItemsMexalLifecycleService } from './order-items-mexal-lifecycle.service';
import { OrderItemsMexalService } from './order-items-mexal.service';

describe('order-items-mexal-lifecycle-service', () => {
  let orderItemsMexalLifecycleService: OrderItemsMexalLifecycleService;
  let purchaseOrderService: MockCrudService<PurchaseOrder>;
  let orderItemsMexalService: MockCrudService<OrderItemsMexal> & {
    deleteMany?: jest.Mock;
  };
  let purchaseOrderAcknowledgementService: MockCrudService<PurchaseOrderAcknowledgement>;
  let eventEmitter: MockEventEmitter;
  let fileOutputService: MockFileOutputService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: EventEmitter2,
          useClass: MockEventEmitter,
        },
        {
          provide: FileOutputService,
          useClass: MockFileOutputService,
        },
        {
          provide: PurchaseOrderService,
          useClass: MockCrudService,
        },
        {
          provide: OrderItemsMexalService,
          useClass: MockCrudService,
        },
        {
          provide: PurchaseOrderAcknowledgementService,
          useClass: MockCrudService,
        },
        OrderItemsMexalLifecycleService,
      ],
    }).compile();

    orderItemsMexalLifecycleService = moduleRef.get(
      OrderItemsMexalLifecycleService,
    );
    purchaseOrderService = moduleRef.get(PurchaseOrderService);
    orderItemsMexalService = moduleRef.get(OrderItemsMexalService);
    orderItemsMexalService.deleteMany = jest.fn();
    purchaseOrderAcknowledgementService = moduleRef.get(
      PurchaseOrderAcknowledgementService,
    );
    eventEmitter = moduleRef.get(EventEmitter2);
    fileOutputService = moduleRef.get(FileOutputService);
  });

  describe('onOrderItemsMexalCreate', () => {
    it('should not output if all orderItems are OBSOLETE', async () => {
      const purchaseOrder: PurchaseOrder = {
        orderNumber: 'AAAAAA',
        amazonVendorCode: 'GGVFC',
        lineItems: [{ productStatus: ProductStatusType.OBSOLETE }],
      } as PurchaseOrder;

      // return all non-obsolete items, in this case none
      orderItemsMexalService.getMany.mockImplementation(() => []);
      purchaseOrderService.getOne.mockImplementation(() => purchaseOrder);

      await orderItemsMexalLifecycleService.onOrderItemsMexalCreate(
        'AAAAAA',
        'GGVFC',
      );

      expect(fileOutputService.outputOrderMessageOut).not.toHaveBeenCalled();
    });
  });

  describe('onOrderItemsMexalForward', () => {
    let purchaseOrder: PurchaseOrder;
    let orderItemsMexal: OrderItemsMexal[];

    beforeEach(async () => {
      purchaseOrder = undefined;
      orderItemsMexal = undefined;
    });

    it('should create the correct ack based on the purchaseOrder', async () => {
      purchaseOrder = {
        orderNumber: 'AAAAAA',
        amazonVendorCode: 'GGVFC',
        lineItems: [
          {
            orderedQuantity: 10,
            productStatus: ProductStatusType.OBSOLETE,
            netPrice: 12.5,
          },
          {
            orderedQuantity: 5,
            productStatus: ProductStatusType.CURRENT,
          },
        ],
      } as PurchaseOrder;
      orderItemsMexal = [
        {
          lineItem: purchaseOrder.lineItems[0],
          purchaseOrder: purchaseOrder,
          status: OrderItemsMexalStatusType.OBSOLETE,
        },
        {
          lineItem: purchaseOrder.lineItems[1],
          purchaseOrder: purchaseOrder,
          status: OrderItemsMexalStatusType.FORWARDED,
        },
      ] as OrderItemsMexal[];

      purchaseOrderService.getOne.mockImplementation(() => purchaseOrder);
      orderItemsMexalService.getMany.mockImplementation(() => orderItemsMexal);

      await orderItemsMexalLifecycleService.onOrderItemsMexalForward(
        purchaseOrder.orderNumber,
        purchaseOrder.amazonVendorCode,
      );

      const expected = {
        purchaseOrder: purchaseOrder,
        lineItemAcknowledgements: [
          {
            status: LineItemAcknowledgementStatusType.OBSOLETE,
            quantityHardReject: purchaseOrder.lineItems[0].orderedQuantity,
            netPrice: purchaseOrder.lineItems[0].netPrice,
            lineItem: purchaseOrder.lineItems[0],
          },
          {
            status: LineItemAcknowledgementStatusType.PARTIAL,
            lineItem: purchaseOrder.lineItems[1],
          },
        ],
      } as PurchaseOrderAcknowledgement;
      expect(
        purchaseOrderAcknowledgementService.createOne,
      ).toHaveBeenCalledTimes(1);
      expect(
        purchaseOrderAcknowledgementService.createOne.mock.calls[0][1],
      ).toEqual(expected);
    });

    it('should emit the right event when the order is complete', async () => {
      purchaseOrder = {
        orderNumber: 'AAAAAB',
        amazonVendorCode: 'GGVFC',
        lineItems: [
          {
            orderedQuantity: 3,
            productStatus: ProductStatusType.OBSOLETE,
          },
        ],
      } as PurchaseOrder;

      orderItemsMexal = [
        {
          purchaseOrder: purchaseOrder,
          lineItem: purchaseOrder.lineItems[0],
          status: OrderItemsMexalStatusType.OBSOLETE,
        },
      ] as OrderItemsMexal[];

      purchaseOrderService.getOne.mockImplementation(() => purchaseOrder);
      orderItemsMexalService.getMany.mockImplementation(() => orderItemsMexal);

      await orderItemsMexalLifecycleService.onOrderItemsMexalForward(
        purchaseOrder.orderNumber,
        purchaseOrder.amazonVendorCode,
      );

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        AppEvents.PURCHASE_ORDER_ACKNOWLEDGEMENT_COMPLETE,
        purchaseOrder.orderNumber,
        purchaseOrder.amazonVendorCode,
      );
    });

    it('should not emit an event when the order needs completion', async () => {
      purchaseOrder = {
        orderNumber: 'AAAAAC',
        amazonVendorCode: 'GGVFC',
        lineItems: [
          {
            orderedQuantity: 3,
            productStatus: ProductStatusType.CURRENT,
          },
        ],
      } as PurchaseOrder;

      orderItemsMexal = [
        {
          purchaseOrder: purchaseOrder,
          lineItem: purchaseOrder.lineItems[0],
          status: OrderItemsMexalStatusType.FORWARDED,
        },
      ] as OrderItemsMexal[];

      purchaseOrderService.getOne.mockImplementation(() => purchaseOrder);
      orderItemsMexalService.getMany.mockImplementation(() => orderItemsMexal);

      await orderItemsMexalLifecycleService.onOrderItemsMexalForward(
        purchaseOrder.orderNumber,
        purchaseOrder.amazonVendorCode,
      );

      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it("should delete all the orderItemsMexal after it's done", async () => {
      purchaseOrder = {
        orderNumber: 'AAAAAE',
        amazonVendorCode: 'GGVFC',
        lineItems: [
          {
            orderedQuantity: 10,
            productStatus: ProductStatusType.OBSOLETE,
          },
          {
            orderedQuantity: 5,
            productStatus: ProductStatusType.CURRENT,
          },
        ],
      } as PurchaseOrder;
      orderItemsMexal = [
        {
          lineItem: purchaseOrder.lineItems[0],
          purchaseOrder: purchaseOrder,
          status: OrderItemsMexalStatusType.OBSOLETE,
        },
        {
          lineItem: purchaseOrder.lineItems[1],
          purchaseOrder: purchaseOrder,
          status: OrderItemsMexalStatusType.FORWARDED,
        },
      ] as OrderItemsMexal[];

      purchaseOrderService.getOne.mockImplementation(() => purchaseOrder);
      orderItemsMexalService.getMany.mockImplementation(() => orderItemsMexal);

      await orderItemsMexalLifecycleService.onOrderItemsMexalForward(
        purchaseOrder.orderNumber,
        purchaseOrder.amazonVendorCode,
      );

      orderItemsMexal[0].status = OrderItemsMexalStatusType.REJECTED;
      orderItemsMexal[1].status = OrderItemsMexalStatusType.ACKNOWLEDGED;
      expect(orderItemsMexalService.deleteMany).toHaveBeenCalledWith(
        orderItemsMexal,
      );
    });
  });

  describe('getFullOrderItemsMexalWithStatus', () => {
    it('Makes the correct query', async () => {
      const purchaseOrder = {
        id: 4,
        orderNumber: 'AAAAAD',
        amazonVendorCode: 'GGVFC',
        lineItems: [
          {
            orderedQuantity: 10,
            productStatus: ProductStatusType.OBSOLETE,
          },
          {
            orderedQuantity: 5,
            productStatus: ProductStatusType.CURRENT,
          },
        ],
      } as PurchaseOrder;

      const statusIn = [
        OrderItemsMexalStatusType.FORWARDED,
        OrderItemsMexalStatusType.OBSOLETE,
      ];

      const crudRequest = makeEmptyCrudRequest();
      crudRequest.parsed.search = {
        status: { $in: statusIn },
        'purchaseOrder.id': { $eq: purchaseOrder.id },
      };
      crudRequest.options.query.join = {
        lineItem: { eager: true },
        purchaseOrder: { eager: true },
      };

      await orderItemsMexalLifecycleService.getFullOrderItemsMexalWithStatus(
        purchaseOrder,
        statusIn,
      );
      expect(orderItemsMexalService.getMany).toHaveBeenCalledWith(crudRequest);
    });
  });
});

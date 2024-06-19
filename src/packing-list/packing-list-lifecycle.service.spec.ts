import { Test } from '@nestjs/testing';
import { PackingListService } from './packing-list.service';
import { MockCrudService } from 'test/src/common/service/mock-crud.service';
import { PurchaseOrderService } from 'src/purchase-order/purchase-order.service';
import { LineItemService } from 'src/line-item/line-item.service';
import { PackingListLifecycleService } from './packing-list-lifecycle.service';
import { PurchaseOrder } from 'src/purchase-order/entities/purchase-order.entity';
import { LineItem } from 'src/line-item/entities/line-item.entity';
import { PackingListMessageIn } from './dto/packing-list-message-in';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MockEventEmitter } from 'test/src/common/service/mock-event-emitter.service';
import { PurchaseOrderAcknowledgementService } from 'src/purchase-order-acknowledgement/purchase-order-acknowledgement.service';
import { PurchaseOrderAcknowledgement } from 'src/purchase-order-acknowledgement/entities/purchase-order-acknowledgement.entity';
import { PackageMessageLineIn } from 'src/package-line/dto/package-message-line-in';
import { OrderResponseMessageIn } from 'src/purchase-order-acknowledgement/dto/order-response-message-in';
import { PackageService } from 'src/package/package.service';
import { PackageLineService } from 'src/package-line/package-line.service';

describe('packing-list-lifecycle-service', () => {
  let packingListLifecyleService: PackingListLifecycleService;
  let purchaseOrderService: MockCrudService<PurchaseOrder>;
  let lineItemService: MockCrudService<LineItem>;
  let eventEmitter: MockEventEmitter;
  let purchaseOrderAcknowledgementService: MockCrudService<PurchaseOrderAcknowledgement>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        { provide: PackingListService, useClass: MockCrudService },
        { provide: PurchaseOrderService, useClass: MockCrudService },
        { provide: LineItemService, useClass: MockCrudService },
        { provide: PackageService, useClass: MockCrudService },
        { provide: PackageLineService, useClass: MockCrudService },
        { provide: EventEmitter2, useClass: MockEventEmitter },
        {
          provide: PurchaseOrderAcknowledgementService,
          useClass: MockCrudService,
        },
        PackingListLifecycleService,
      ],
    }).compile();
    packingListLifecyleService = moduleRef.get(PackingListLifecycleService);
    purchaseOrderService = moduleRef.get(PurchaseOrderService);
    lineItemService = moduleRef.get(LineItemService);
    eventEmitter = moduleRef.get(EventEmitter2);
    purchaseOrderAcknowledgementService = moduleRef.get(
      PurchaseOrderAcknowledgementService,
    );
  });

  describe('dedupePackingListMessageLines', () => {
    it('retains all important info', () => {
      const packingListMessage: PackingListMessageIn = {
        documentNumber: 'BC/1234',
        shipToName: 'Amazon Atlantis',
        shipToGLN: '789456123',
        shipToAddressLine1: 'Via del mare, 24',
        shipToAddressLine2: 'Frazionamento 6',
        shipToCity: 'Atlantis',
        shipToCountryCode: 'AT',
        shipToPostalCode: '7154',
        packages: [
          {
            weight: 2,
            height: 10,
            length: 10,
            width: 10,
            packageNumber: '45',
            SSCC: '000001111112222245',
            lineItems: [
              {
                orderNumber: 'ABCD',
                itemNumber: '00114789',
                shippedQuantity: 5,
              },
            ],
          },
        ],
      };
      const newMessage =
        packingListLifecyleService.dedupePackingListMessageLines(
          packingListMessage,
        );
      expect(newMessage).toEqual(packingListMessage);
    });

    it('aggregates package line dupes into single lines', () => {
      const packingListMessage: PackingListMessageIn = {
        packages: [
          {
            lineItems: [
              {
                orderNumber: 'ABCD',
                itemNumber: '0',
                shippedQuantity: 5,
              },
              {
                orderNumber: 'ABCD',
                itemNumber: '0',
                shippedQuantity: 5,
              },
            ],
          },
        ],
      } as PackingListMessageIn;

      const newMessage =
        packingListLifecyleService.dedupePackingListMessageLines(
          packingListMessage,
        );

      const expectedResult: PackingListMessageIn = {
        packages: [
          {
            lineItems: [
              {
                orderNumber: 'ABCD',
                itemNumber: '0',
                shippedQuantity: 10,
              },
            ],
          },
        ],
      } as PackingListMessageIn;

      expect(newMessage).toEqual(expectedResult);
    });

    it('does not aggregate the same item in different orders', () => {
      const packingListMessage: PackingListMessageIn = {
        packages: [
          {
            lineItems: [
              {
                orderNumber: 'ABCD',
                itemNumber: '0',
                shippedQuantity: 5,
              },
              {
                orderNumber: 'DEFG',
                itemNumber: '0',
                shippedQuantity: 5,
              },
            ],
          },
        ],
      } as PackingListMessageIn;

      const newMessage =
        packingListLifecyleService.dedupePackingListMessageLines(
          packingListMessage,
        );

      expect(newMessage).toEqual(packingListMessage);
    });

    it('does not touch items in different packages', () => {
      const packingListMessage: PackingListMessageIn = {
        packages: [
          {
            lineItems: [
              {
                orderNumber: 'ABCD',
                itemNumber: '0',
                shippedQuantity: 5,
              },
            ],
          },
          {
            lineItems: [
              {
                orderNumber: 'ABCD',
                itemNumber: '0',
                shippedQuantity: 5,
              },
            ],
          },
        ],
      } as PackingListMessageIn;

      const newMessage =
        packingListLifecyleService.dedupePackingListMessageLines(
          packingListMessage,
        );

      expect(newMessage).toEqual(packingListMessage);
    });
  });

  describe('getPurchaseOrderAcknowledgementUpdateMessageFromLineItems', () => {
    it('creates the correct update message', async () => {
      const poa: PurchaseOrderAcknowledgement = {
        purchaseOrder: {
          amazonVendorCode: 'GGGGG',
          deliveryDateStart: '2023-05-25',
          deliveryDateEnd: '2023-06-25',
          orderNumber: 'ABCD',
          shipToGLN: '012345',
        },
        lineItemAcknowledgements: [
          { lineItem: { itemNumber: '1' }, netPrice: 10 },
          { lineItem: { itemNumber: '2' }, netPrice: 20 },
        ],
      } as PurchaseOrderAcknowledgement;

      purchaseOrderAcknowledgementService[
        'getFullPurchaseOrderAcknowledgement'
      ] = jest.fn();
      purchaseOrderAcknowledgementService[
        'getFullPurchaseOrderAcknowledgement'
      ].mockImplementation(() => poa);

      const shippedQuantities = [3, 4];
      const packageLineMessages: PackageMessageLineIn[] = [
        {
          itemNumber: '1',
          orderNumber: 'ABCD',
          shippedQuantity: shippedQuantities[0],
        },
        {
          itemNumber: '2',
          orderNumber: 'ABCD',
          shippedQuantity: shippedQuantities[1],
        },
      ];
      const result =
        await packingListLifecyleService.getPurchaseOrderAcknowledgementUpdateMessageFromLineItems(
          'ABCD',
          packageLineMessages,
        );

      const expectedResult: OrderResponseMessageIn = {
        orderNumber: 'ABCD',
        amazonVendorCode: 'GGGGG',
        deliveryDateStart: '2023-05-25',
        deliveryDateEnd: '2023-06-25',
        shipToGLN: '012345',
        lineItems: [
          {
            itemNumber: '1',
            netPrice: 10,
            orderedQuantity: shippedQuantities[0],
          },
          {
            itemNumber: '2',
            netPrice: 20,
            orderedQuantity: shippedQuantities[1],
          },
        ],
      } as OrderResponseMessageIn;

      expect(result.isEmpty()).toBeFalsy();
      delete result.isEmpty;
      expect(result).toEqual(expectedResult);
    });
  });
});

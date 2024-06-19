import { Injectable, Logger } from '@nestjs/common';
import { OnEvent, EventEmitter2 } from '@nestjs/event-emitter';
import { AppEvents } from 'src/common/event/app-events';
import { makeEmptyCrudRequest } from 'src/common/util/crud-request-util';
import { FileOutputService } from 'src/file-output/file-output.service';
import { LineItemAcknowledgement } from 'src/line-item-acknowledgement/entities/line-item-acknowledgement.entity';
import { LineItemAcknowledgementStatusType } from 'src/line-item-acknowledgement/enum/line-item-acknowledgement-status-type.enum';
import { ProductStatusType } from 'src/product/enum/product-status-type.enum';
import { PurchaseOrderAcknowledgement } from 'src/purchase-order-acknowledgement/entities/purchase-order-acknowledgement.entity';
import { PurchaseOrderAcknowledgementStatusType } from 'src/purchase-order-acknowledgement/enum/purchase-order-acknowledgement-status-type.enum';
import { PurchaseOrderAcknowledgementService } from 'src/purchase-order-acknowledgement/purchase-order-acknowledgement.service';
import { OrderMessageOut } from 'src/purchase-order/dto/order-message-out';
import { PurchaseOrder } from 'src/purchase-order/entities/purchase-order.entity';
import { PurchaseOrderService } from 'src/purchase-order/purchase-order.service';
import { OrderItemsMexal } from './entities/order-items-mexal.entity';
import { OrderItemsMexalStatusType } from './enum/order-item-mexal-status-type.enum';
import { OrderItemsMexalService } from './order-items-mexal.service';

@Injectable()
export class OrderItemsMexalLifecycleService {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly purchaseOrderService: PurchaseOrderService,
    private readonly orderItemsMexalService: OrderItemsMexalService,
    private readonly fileOutputService: FileOutputService,
    private readonly purchaseOrderAcknowledgementService: PurchaseOrderAcknowledgementService,
  ) {}

  private readonly logger = new Logger(OrderItemsMexalLifecycleService.name);

  @OnEvent(AppEvents.ORDER_CREATE)
  async onOrderCreate(purchaseOrderNumber: string, amazonVendorCode: string) {
    this.logger.debug(`Received new PO ${purchaseOrderNumber}`);
    const purchaseOrder = await this.getFullPurchaseOrder(
      purchaseOrderNumber,
      amazonVendorCode,
    );
    await this.createOrderItemsMexalForPurchaseOrder(purchaseOrder);
    this.logger.debug(`Created OIMs for ${purchaseOrderNumber}`);
    this.eventEmitter.emit(
      AppEvents.ORDER_ITEMS_MEXAL_CREATE,
      purchaseOrderNumber,
      amazonVendorCode,
    );
  }

  @OnEvent(AppEvents.ORDER_ITEMS_MEXAL_CREATE)
  async onOrderItemsMexalCreate(
    purchaseOrderNumber: string,
    amazonVendorCode: string,
  ) {
    // get purchase order
    const purchaseOrder = await this.getFullPurchaseOrder(
      purchaseOrderNumber,
      amazonVendorCode,
    );

    // can be zero accepted items, all obsolete
    const orderItems = await this.getFullOrderItemsMexalWithStatus(
      purchaseOrder,
      [OrderItemsMexalStatusType.ACCEPTED],
    );

    await this.outputOrderMessageForPurchaseOrder(purchaseOrder, orderItems);
    this.logger.debug(`Output PO message for ${purchaseOrderNumber}`);

    for (const orderItem of orderItems) {
      orderItem.status = OrderItemsMexalStatusType.FORWARDED;
      const saveRequest = makeEmptyCrudRequest();
      saveRequest.parsed.search = {
        id: { $eq: orderItem.id },
      };
      await this.orderItemsMexalService.updateOne(saveRequest, orderItem);
    }
    this.logger.debug(`All OIMs forwarded for ${purchaseOrderNumber}`);

    this.eventEmitter.emit(
      AppEvents.ORDER_ITEMS_MEXAL_FORWARD,
      purchaseOrderNumber,
      amazonVendorCode,
    );
  }

  @OnEvent(AppEvents.ORDER_ITEMS_MEXAL_FORWARD)
  async onOrderItemsMexalForward(
    purchaseOrderNumber: string,
    amazonVendorCode: string,
  ) {
    const purchaseOrder = await this.getFullPurchaseOrder(
      purchaseOrderNumber,
      amazonVendorCode,
    );

    const orderItemsMexal = await this.getFullOrderItemsMexalWithStatus(
      purchaseOrder,
      [OrderItemsMexalStatusType.OBSOLETE, OrderItemsMexalStatusType.FORWARDED],
    );

    const purchaseOrderAcknowledgement =
      this.createPurchaseOrderAcknowledgementForPurchaseOrder(
        purchaseOrder,
        orderItemsMexal,
      );

    const saveRequest = makeEmptyCrudRequest();
    await this.purchaseOrderAcknowledgementService.createOne(
      saveRequest,
      purchaseOrderAcknowledgement,
    );
    this.logger.debug(`Created POA for ${purchaseOrderNumber}`);
    await this.orderItemsMexalService.deleteMany(orderItemsMexal);
    this.logger.debug(`Deleted OIMs for ${purchaseOrderNumber}`);

    if (
      purchaseOrderAcknowledgement.status ===
      PurchaseOrderAcknowledgementStatusType.COMPLETE
    ) {
      this.eventEmitter.emit(
        AppEvents.PURCHASE_ORDER_ACKNOWLEDGEMENT_COMPLETE,
        purchaseOrder.orderNumber,
        purchaseOrder.amazonVendorCode,
      );
    }
  }

  public async getFullOrderItemsMexalWithStatus(
    purchaseOrder: PurchaseOrder,
    statusIn: OrderItemsMexalStatusType[],
  ) {
    const orderItemsMexalQuery = makeEmptyCrudRequest();
    orderItemsMexalQuery.parsed.search = {
      status: {
        $in: statusIn,
      },
      'purchaseOrder.id': { $eq: purchaseOrder.id },
    };
    orderItemsMexalQuery.options.query.join = {
      lineItem: { eager: true },
      purchaseOrder: { eager: true },
    };
    return this.orderItemsMexalService.getMany(orderItemsMexalQuery) as Promise<
      OrderItemsMexal[]
    >;
  }

  public async getFullPurchaseOrder(
    purchaseOrderNumber: string,
    amazonVendorCode: string,
  ) {
    const queryRequest = makeEmptyCrudRequest();
    queryRequest.parsed.search = {
      orderNumber: { $eq: purchaseOrderNumber },
      amazonVendorCode: { $eq: amazonVendorCode },
    };
    queryRequest.options.query.join = {
      lineItems: { eager: true },
    };
    return this.purchaseOrderService.getOne(queryRequest);
  }

  async createOrderItemsMexalForPurchaseOrder(purchaseOrder: PurchaseOrder) {
    const saveRequest = makeEmptyCrudRequest();
    const items: OrderItemsMexal[] = [];
    for (const lineItem of purchaseOrder.lineItems) {
      const orderItemsMexal = new OrderItemsMexal();
      orderItemsMexal.lineItem = lineItem;
      orderItemsMexal.purchaseOrder = purchaseOrder;
      switch (lineItem.productStatus) {
        case ProductStatusType.CURRENT:
          orderItemsMexal.status = OrderItemsMexalStatusType.ACCEPTED;
          break;
        case ProductStatusType.OBSOLETE:
          orderItemsMexal.status = OrderItemsMexalStatusType.OBSOLETE;
          break;
      }
      items.push(orderItemsMexal);
    }
    await this.orderItemsMexalService.createMany(saveRequest, { bulk: items });
  }

  /**
   * @param purchaseOrder Is modified as a side effect
   */
  async outputOrderMessageForPurchaseOrder(
    purchaseOrder: PurchaseOrder,
    orderItems: OrderItemsMexal[],
  ) {
    // prepare set of line item ids to filter purchase order line items
    const validLineItemIds = new Set(
      orderItems.map((orderItem) => orderItem.lineItem.id),
    );

    purchaseOrder.lineItems = purchaseOrder.lineItems.filter((item) =>
      validLineItemIds.has(item.id),
    );

    if (purchaseOrder.lineItems.length > 0) {
      const orderMessage = new OrderMessageOut();
      orderMessage.copyValues(purchaseOrder);
      await this.fileOutputService.outputOrderMessageOut(orderMessage);
    }
  }

  /**
   * @param orderItemsMexal They are updated in-place. They need to be saved separately
   */
  createPurchaseOrderAcknowledgementForPurchaseOrder(
    purchaseOrder: PurchaseOrder,
    orderItemsMexal: OrderItemsMexal[],
  ) {
    const purchaseOrderAcknowledgement = new PurchaseOrderAcknowledgement();
    purchaseOrderAcknowledgement.purchaseOrder = purchaseOrder;
    purchaseOrderAcknowledgement.lineItemAcknowledgements = [];
    for (const orderItem of orderItemsMexal) {
      const lineItemAcknowledgement = new LineItemAcknowledgement();
      lineItemAcknowledgement.lineItem = orderItem.lineItem;
      switch (orderItem.status) {
        case OrderItemsMexalStatusType.OBSOLETE:
          lineItemAcknowledgement.status =
            LineItemAcknowledgementStatusType.OBSOLETE;
          lineItemAcknowledgement.quantityHardReject =
            orderItem.lineItem.orderedQuantity;
          lineItemAcknowledgement.netPrice = orderItem.lineItem.netPrice;
          orderItem.status = OrderItemsMexalStatusType.REJECTED;
          break;
        case OrderItemsMexalStatusType.FORWARDED:
          lineItemAcknowledgement.status =
            LineItemAcknowledgementStatusType.PARTIAL;
          orderItem.status = OrderItemsMexalStatusType.ACKNOWLEDGED;
          break;
      }
      purchaseOrderAcknowledgement.lineItemAcknowledgements.push(
        lineItemAcknowledgement,
      );
    }
    if (purchaseOrderAcknowledgement.isComplete()) {
      purchaseOrderAcknowledgement.status =
        PurchaseOrderAcknowledgementStatusType.COMPLETE;
    }
    return purchaseOrderAcknowledgement;
  }
}

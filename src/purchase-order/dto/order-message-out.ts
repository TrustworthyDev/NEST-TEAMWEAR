import { Expose, Transform, Type } from 'class-transformer';
import { ISODatestringToYYYYMMDD } from 'src/common/util/date-util';
import * as util from 'src/common/util/misc-util';
import { LineItemMessageOut } from 'src/line-item/dto/line-item-message-out';
import { PurchaseOrder } from '../entities/purchase-order.entity';

export class OrderMessageOut {
  @Expose()
  orderNumber: string;

  @Expose()
  @Transform(({ value }) => ISODatestringToYYYYMMDD(value))
  dateIssued: string;

  @Expose()
  @Transform(({ value }) => ISODatestringToYYYYMMDD(value))
  deliveryDateStart: string;

  @Expose()
  @Transform(({ value }) => ISODatestringToYYYYMMDD(value))
  deliveryDateEnd: string;

  @Expose()
  amazonVendorCode: string;

  @Expose()
  shipToGLN: string;

  @Expose()
  @Type(() => LineItemMessageOut)
  lineItems: LineItemMessageOut[];

  copyValues(purchaseOrder: PurchaseOrder): OrderMessageOut {
    const names = [
      'orderNumber',
      'dateIssued',
      'deliveryDateStart',
      'deliveryDateEnd',
      'amazonVendorCode',
      'shipToGLN',
    ];
    util.copyValues(this, purchaseOrder, names);
    this.lineItems = purchaseOrder.lineItems.map((lineItem) => {
      const lineItemMessage = new LineItemMessageOut();
      return lineItemMessage.copyValues(lineItem);
    });
    return this;
  }
}

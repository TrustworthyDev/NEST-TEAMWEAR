import { Exclude, Expose, Type } from 'class-transformer';
import { LineItemAcknowledgementMessageOut } from 'src/line-item-acknowledgement/dto/line-item-acknowledgement-message-out';
import { PurchaseOrderAcknowledgement } from '../entities/purchase-order-acknowledgement.entity';
import * as util from 'src/common/util/misc-util';

export class OrderAcknowledgementMessageOut {
  @Exclude()
  marketplace: string;

  @Expose()
  orderNumber: string;

  @Expose()
  supplierGLN: string;

  @Expose()
  shipToGLN: string;

  @Expose()
  shipToCountryCode: string;

  @Expose()
  currencyISOCode: string;

  @Expose()
  get containsChanges(): boolean {
    return this.lineItems.some((lineItem) => lineItem.containsChanges);
  }

  @Expose()
  @Type(() => LineItemAcknowledgementMessageOut)
  lineItems: LineItemAcknowledgementMessageOut[];

  copyValues(
    purchaseOrderAcknowledgement: PurchaseOrderAcknowledgement,
  ): OrderAcknowledgementMessageOut {
    const names = [
      'marketplace',
      'orderNumber',
      'shipToGLN',
      'shipToCountryCode',
      'currencyISOCode',
      'supplierGLN',
    ];
    util.copyValues(this, purchaseOrderAcknowledgement.purchaseOrder, names);
    this.lineItems = purchaseOrderAcknowledgement.lineItemAcknowledgements.map(
      (lia) => {
        const lineItemMessage = new LineItemAcknowledgementMessageOut();
        return lineItemMessage.copyValues(lia);
      },
    );
    return this;
  }
}

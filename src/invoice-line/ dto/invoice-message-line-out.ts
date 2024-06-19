import { Expose } from 'class-transformer';
import { InvoiceLine } from '../entities/invoice-line.entity';
import * as util from 'src/common/util/misc-util';

export class InvoiceMessageLineOut {
  @Expose()
  itemNumber: string;

  @Expose()
  itemNumberType: string;

  @Expose()
  invoicedQuantity: number;

  @Expose()
  totalNetPrice: number;

  @Expose()
  netPrice: number;

  @Expose()
  orderNumber: string;

  @Expose()
  taxRate: number;

  copyValues(invoiceLine: InvoiceLine): InvoiceMessageLineOut {
    this.orderNumber = invoiceLine.lineItem.purchaseOrder.orderNumber;
    util.copyValues(this, invoiceLine.lineItem, [
      'itemNumber',
      'itemNumberType',
    ]);
    const names = ['invoicedQuantity', 'totalNetPrice', 'netPrice', 'taxRate'];
    return util.copyValues(this, invoiceLine, names);
  }
}

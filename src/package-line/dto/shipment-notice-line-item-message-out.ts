import { Expose } from 'class-transformer';
import { PackageLine } from '../entities/package-line.entity';
import { copyValues } from 'src/common/util/misc-util';

export class ShipmentNoticeLineItemMessageOut {
  @Expose()
  itemNumber: string;

  @Expose()
  shippedQuantity: number;

  @Expose()
  orderNumber: string;

  copyValues(packageLine: PackageLine): ShipmentNoticeLineItemMessageOut {
    copyValues(this, packageLine, ['shippedQuantity']);
    this.itemNumber = packageLine.lineItem.itemNumber;
    this.orderNumber = packageLine.lineItem.purchaseOrder.orderNumber;
    return this;
  }
}

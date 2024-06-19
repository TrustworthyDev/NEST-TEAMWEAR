import { Expose, Type } from 'class-transformer';
import { copyValues } from 'src/common/util/misc-util';
import { ShipmentNoticeLineItemMessageOut } from 'src/package-line/dto/shipment-notice-line-item-message-out';
import { Package } from 'src/package/entities/package.entity';

export class ShipmentNoticePackageMessageOut {
  @Expose()
  length: number;

  @Expose()
  width: number;

  @Expose()
  height: number;

  @Expose()
  weight: number;

  @Expose()
  SSCC: string;

  @Expose()
  trackingNumber: string;

  @Expose()
  @Type(() => ShipmentNoticeLineItemMessageOut)
  lineItems: ShipmentNoticeLineItemMessageOut[];

  copyValues(aPackage: Package): ShipmentNoticePackageMessageOut {
    copyValues(this, aPackage, ['SSCC', 'width', 'length', 'height', 'weight']);
    this.trackingNumber = aPackage.shipmentPackage.trackingNumber;
    this.lineItems = aPackage.packageLines.map((lin) => {
      const lineItemMessage = new ShipmentNoticeLineItemMessageOut();
      return lineItemMessage.copyValues(lin);
    });
    return this;
  }
}

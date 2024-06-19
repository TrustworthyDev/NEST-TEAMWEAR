import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { PackingList } from '../entities/packing-list.entity';
import {
  ISODatestringToYYYYMMDD,
  dateToISODatestring,
} from 'src/common/util/date-util';
import { copyValues } from 'src/common/util/misc-util';
import { ShipmentNoticePackageMessageOut } from 'src/package/dto/shipment-notice-package-message-out';
import { StandardCarrierAlphaCodes } from 'src/shipment/enum/standard-carrier-alpha-codes.enum';

export class ShipmentNoticeMessageOut {
  @Exclude()
  marketplace: string;

  @Expose()
  packingListNumber: string;

  // With the division of identification and tracking this is now actually tracking
  @Expose()
  shipmentIdentificationNumber: string;

  @Expose()
  @Transform(({ value }) => ISODatestringToYYYYMMDD(value))
  despatchDate: string;

  @Expose()
  @Transform(({ value }) => ISODatestringToYYYYMMDD(value))
  estimatedDeliveryDate: string;

  @Expose()
  shipToGLN: string;

  @Expose()
  shipToCountryCode: string;

  @Expose()
  supplierGLN: string;

  @Expose()
  shipFromGLN: string;

  @Expose()
  shipFromCountryCode: string;

  @Expose()
  shipFromPostalCode: string;

  @Expose()
  numberOfPackages: number;

  @Expose()
  SCAC: string;

  @Expose()
  isEdit: boolean;

  @Expose()
  @Type(() => ShipmentNoticePackageMessageOut)
  packages: ShipmentNoticePackageMessageOut[];

  copyValues(packingList: PackingList): ShipmentNoticeMessageOut {
    this.marketplace = packingList.purchaseOrders[0].marketplace;
    this.packingListNumber = packingList.documentNumber.replace(
      new RegExp('[/_]', 'g'),
      '',
    );
    this.shipmentIdentificationNumber =
      packingList.shipment.shipmentTrackingNumber ||
      packingList.shipment.shipmentIdentificationNumber;
    this.despatchDate = dateToISODatestring(packingList.shipment.date);
    this.estimatedDeliveryDate = packingList.shipment.estimatedDeliveryDate;
    this.SCAC = StandardCarrierAlphaCodes[packingList.shipment.courier];
    copyValues(this, packingList, ['shipToGLN', 'shipToCountryCode']);
    this.numberOfPackages = packingList.packages.length;
    this.packages = packingList.packages.map((pk) => {
      const packageMessage = new ShipmentNoticePackageMessageOut();
      return packageMessage.copyValues(pk);
    });
    return this;
  }
}

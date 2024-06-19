import { Injectable } from '@nestjs/common';
import { OrderMessageOut } from 'src/purchase-order/dto/order-message-out';
import * as fs from 'fs/promises';
import * as path from 'path';
import { instanceToPlain } from 'class-transformer';
import { EnvelopeOrderMessageOut } from 'src/purchase-order/dto/envelope-order-message-out';
import { OrderAcknowledgementMessageOut } from 'src/purchase-order-acknowledgement/dto/order-acknowledgement-message-out';
import { EnvelopeOrderAcknowledgementMessageOut } from 'src/purchase-order-acknowledgement/dto/envelope-order-acknowledgement-message-out';
import { writeFileWithTemp } from 'src/common/util/file-util';
import { InvoiceMessageOut } from 'src/invoice/dto/invoice-message-out';
import { EnvelopeInvoiceMessageOut } from 'src/invoice/dto/envelope-invoice-message-out';
import { ShipmentNoticeMessageOut } from 'src/packing-list/dto/shipment-notice-message-out';
import { EnvelopeShipmentNoticeMessageOut } from 'src/packing-list/dto/envelope-shipment-notice-message-out';

@Injectable()
export class FileOutputService {
  baseDirectory: string;
  orderMessageDirectory: string;
  orderAcknowledgementMessageDirectory: string;
  invoiceMessageDirectory: string;
  shipmentNoticeMessageDirectory: string;

  constructor() {
    this.baseDirectory = '/home/stefano_bane/gg-teamwear/internalFileExchange/';
    this.orderMessageDirectory = path.join(
      this.baseDirectory,
      'order_message_amazon_json',
    );
    this.orderAcknowledgementMessageDirectory = path.join(
      this.baseDirectory,
      'order_acknowledgement_message',
    );
    this.invoiceMessageDirectory = path.join(
      this.baseDirectory,
      'invoice_message',
    );
    this.shipmentNoticeMessageDirectory = path.join(
      this.baseDirectory,
      'shipment_notice_message',
    );
  }

  async outputOrderMessageOut(orderMessageOut: OrderMessageOut): Promise<void> {
    await fs.mkdir(this.orderMessageDirectory, { recursive: true });
    const filename = path
      .join(this.orderMessageDirectory, orderMessageOut.orderNumber)
      .concat('.json');
    const outObject = new EnvelopeOrderMessageOut();
    outObject.wrap(orderMessageOut);
    const outString = JSON.stringify(instanceToPlain(outObject));
    return writeFileWithTemp(filename, outString);
  }

  async outputOrderAcknowledgementMessageOut(
    orderAcknowledgementMessageOut: OrderAcknowledgementMessageOut,
  ): Promise<void> {
    const outDir = path.join(
      this.orderAcknowledgementMessageDirectory,
      orderAcknowledgementMessageOut.marketplace,
    );
    await fs.mkdir(outDir, { recursive: true });
    const filename = path
      .join(outDir, orderAcknowledgementMessageOut.orderNumber)
      .concat('.json');
    const outObject = new EnvelopeOrderAcknowledgementMessageOut();
    outObject.wrap(orderAcknowledgementMessageOut);
    const outString = JSON.stringify(
      instanceToPlain(outObject, { exposeUnsetFields: false }),
    );
    return writeFileWithTemp(filename, outString);
  }

  async outputInvoiceMessageOut(
    invoiceMessageOut: InvoiceMessageOut,
  ): Promise<void> {
    const outDir = path.join(
      this.invoiceMessageDirectory,
      invoiceMessageOut.marketplace,
    );
    await fs.mkdir(outDir, { recursive: true });
    const filename = path
      .join(outDir, invoiceMessageOut.invoiceNumber)
      .concat('.json');
    const outObject = new EnvelopeInvoiceMessageOut();
    outObject.wrap(invoiceMessageOut);
    const outString = JSON.stringify(
      instanceToPlain(outObject, { exposeUnsetFields: false }),
    );
    return writeFileWithTemp(filename, outString);
  }

  async outputShipmentNoticeMessageOut(
    shipmentNoticeMessageOut: ShipmentNoticeMessageOut,
  ): Promise<void> {
    const outDir = path.join(
      this.shipmentNoticeMessageDirectory,
      shipmentNoticeMessageOut.marketplace,
    );
    await fs.mkdir(outDir, { recursive: true });
    const safeName = shipmentNoticeMessageOut.packingListNumber.replace(
      new RegExp('/', 'g'),
      '',
    );
    const filename = path.join(outDir, safeName).concat('.json');
    const outObject = new EnvelopeShipmentNoticeMessageOut();
    outObject.wrap(shipmentNoticeMessageOut);
    const outString = JSON.stringify(
      instanceToPlain(outObject, { exposeUnsetFields: false }),
    );
    return writeFileWithTemp(filename, outString);
  }
}

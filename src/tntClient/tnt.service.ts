import { BadRequestException, Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import { makeEntityCrudRequest } from 'src/common/util/crud-request-util';
import { groupArrayByFunction } from 'src/common/util/misc-util';
import { Shipment } from 'src/shipment/entities/shipment.entity';
import { Courier } from 'src/shipment/enum/courier.enum';
import { ShipmentStatusType } from 'src/shipment/enum/shipment-status-type.enum';
import { ShipmentService } from 'src/shipment/shipment.service';

@Injectable()
export class TntService {
  constructor(private readonly shipmentService: ShipmentService) {}

  async generateTNTManifest(ids: number[]): Promise<PDFKit.PDFDocument> {
    const shipments = await this.getTntShipments(ids);
    this.checkConsistency(shipments);
    const doc = await this.makeDocument(shipments);

    return doc;
  }

  async makeDocument(shipments: Shipment[]): Promise<PDFKit.PDFDocument> {
    const packages = shipments
      .map((sh) => sh.packingLists)
      .flat()
      .map((pl) => pl.packages)
      .flat();
    const packagesByDimensions = groupArrayByFunction(
      packages,
      (pck) => `${pck.length}\xA0X\xA0${pck.width}\xA0X\xA0${pck.height}\xA0CM`,
    );
    const dimensionsLine = Array.from(packagesByDimensions.entries())
      .map(
        ([dimensions, packages]) =>
          `${dimensions}\xA0${packages.length}\xA0coll${
            packages.length > 1 ? 'i' : 'o'
          }`,
      )
      .join(', ');
    const packageAmount = packages.length;
    const packageWeight = packages.reduce((acc, curr) => acc + curr.weight, 0);

    // A4 (595.28 x 841.89)
    const doc = new PDFDocument({
      margins: { top: 142, bottom: 142, left: 57, right: 57 },
      size: 'A4',
    });
    doc.text(
      "La G&G Sport dichiara di aver consegnato IN DATA __-__-____ al driver dell'azienda TNT.",
    );
    doc.moveDown();

    doc.text('Mittente:');
    doc.moveDown();
    doc.text('G&G Sport');
    doc.text('CIS di Nola ISOLA 5 Lotto 537');
    doc.text('80035');
    doc.moveDown();
    doc.text('Nº colli: ' + packageAmount);
    doc.text('Peso: ' + packageWeight + ' Kg');
    doc.text('Dimensioni:');
    doc.text(dimensionsLine);
    doc.moveDown();

    const onePackingList = shipments[0].packingLists[0];
    doc.text('Merce destinata a:');
    doc.moveDown();
    doc.text(onePackingList.shipToName);
    doc.text(onePackingList.shipToAddressLine1);
    doc.text(onePackingList.shipToPostalCode + ' ' + onePackingList.shipToCity);
    doc.moveDown();

    doc.text('Firma Driver', doc.x, 538);
    doc.text('Responsabile G&G', 290, 538);

    doc.text('Data', doc.page.margins.left, 610);

    doc.image(__dirname + '/../res/img/header.jpg', 0, 0, { width: 595.28 });
    doc.image(
      __dirname + '/../res/img/footer.jpg',
      0,
      doc.page.height - doc.page.margins.bottom,
      { width: 595.28 },
    );

    doc.end();
    return doc;
  }

  checkConsistency(shipments: Shipment[]): void {
    if (!shipments.length) {
      throw new BadRequestException('Empty shipment array');
    }
    const packingLists = shipments.map((sh) => sh.packingLists).flat();
    if (
      packingLists.some(
        (pl, index, array) => pl.shipToGLN != array[0].shipToGLN,
      )
    ) {
      throw new BadRequestException(
        'Some packing lists have a different destination',
      );
    }
  }

  async getTntShipments(ids: number[]): Promise<Shipment[]> {
    const queryRequest = makeEntityCrudRequest<Shipment>();
    queryRequest.parsed.search = {
      id: { $in: ids },
      courier: { $eq: Courier.TNT },
      status: {
        $in: [ShipmentStatusType.CONFIRMED, ShipmentStatusType.NOTIFIED],
      },
    };
    queryRequest.options.query.join = {
      packingLists: { eager: true, alias: 'pl' },
      'packingLists.packages': { eager: true, alias: 'pak' },
    };
    return this.shipmentService.getMany(queryRequest) as Promise<Shipment[]>;
  }
}

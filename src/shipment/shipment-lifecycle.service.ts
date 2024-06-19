import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { AppEvents } from 'src/common/event/app-events';
import { ShipmentService } from './shipment.service';
import { makeEntityCrudRequest } from 'src/common/util/crud-request-util';
import { Shipment } from './entities/shipment.entity';
import { ShippingClient } from 'src/shipping-client/shipping-client';
import { ShipmentStatusType } from './enum/shipment-status-type.enum';
import { PackingList } from 'src/packing-list/entities/packing-list.entity';
import { PackingListService } from 'src/packing-list/packing-list.service';
import { PackingListStatusType } from 'src/packing-list/enum/packing-list-status-type.enum';
import { ShipmentNoticeMessageOut } from 'src/packing-list/dto/shipment-notice-message-out';
import { ConfigService } from '@nestjs/config';
import { ConfigKeys } from 'src/config/config-keys.enum';
import { FileOutputService } from 'src/file-output/file-output.service';
import { appendCartonLabels } from 'src/packing-list/packing-list-util';
import { ShipmentPackageService } from 'src/shipment-package/shipment-package.service';
import { ShipmentPackage } from 'src/shipment-package/entities/shipment-package.entity';

@Injectable()
export class ShipmentLifecycleService {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly shipmentService: ShipmentService,
    private readonly shippingClient: ShippingClient,
    private readonly packingListService: PackingListService,
    private readonly configService: ConfigService<ConfigKeys>,
    private readonly fileOutputService: FileOutputService,
    private readonly shipmentPackageService: ShipmentPackageService,
  ) {}

  private readonly logger = new Logger(ShipmentLifecycleService.name);

  @OnEvent(AppEvents.SHIPMENT_CREATE)
  public async onShipmentCreate(id: number) {
    const shipment = await this.getFullShipmentById(id);

    let resultShipment: Shipment;
    try {
      if (shipment.customsDocuments.length > 0) {
        resultShipment = await this.shippingClient.uploadCustomsDocuments(
          shipment,
        );
      }
      resultShipment = await this.shippingClient.estimateDeliveryDate(shipment);
      resultShipment = await this.shippingClient.ship(resultShipment);
    } catch (err) {
      this.logger.error(`Shipment failed id ${shipment.id}`, err.stack);
      shipment.status = ShipmentStatusType.FAILED;
      shipment.date = new Date();
      shipment.packingLists = [];
      await this.doShipmentUpdate(shipment);
      return;
    }

    resultShipment.status = ShipmentStatusType.CONFIRMED;
    resultShipment.date = new Date();
    await this.doShipmentUpdate(resultShipment);
    for (const packingList of resultShipment.packingLists) {
      packingList.status = PackingListStatusType.SHIPPED;
    }
    await this.doPackingListsUpdate(resultShipment);
    this.eventEmitter.emit(AppEvents.SHIPMENT_CONFIRM, id);
  }

  @OnEvent(AppEvents.SHIPMENT_CONFIRM)
  public async onShipmentConfirm(id: number) {
    try {
      const shipment = await this.getShipmentForCartonLabels(id);

      for (const packingList of shipment.packingLists) {
        appendCartonLabels(packingList);
      }

      for (const shipmentPackage of shipment.packingLists
        .map((pl) => pl.packages)
        .flat()
        .map((pk) => pk.shipmentPackage)) {
        await this.doShipmentPackageUpdate(shipmentPackage);
      }
    } catch (e) {
      this.logger.error(e, e.stack);
    }
  }

  public async voidShipment(id: number) {
    const shipment = await this.getFullShipmentById(id);

    if (
      ![ShipmentStatusType.CONFIRMED, ShipmentStatusType.NOTIFIED].includes(
        shipment.status,
      )
    ) {
      throw new BadRequestException(
        'Only CONFIRMED and NOTIFIED shipments can be voided',
      );
    }

    try {
      await this.shippingClient.voidShipment(shipment);
    } catch (err) {
      throw new BadRequestException(err.message);
    }

    shipment.status = ShipmentStatusType.CANCELLED;
    for (const shipPack of shipment.shipmentPackages) {
      shipPack.package = null;
    }
    await this.doShipmentUpdate(shipment);
    for (const packingList of shipment.packingLists) {
      packingList.status = PackingListStatusType.RECEIVED;
      packingList.shipment = null;
    }
    await this.doPackingListsUpdate(shipment);
  }

  async onSendShipmentNotice(shipmentId: number) {
    const shipment = await this.getShipmentForShipmentNotice(shipmentId);

    for (const packingList of shipment.packingLists) {
      const shipmentNoticeMessage = new ShipmentNoticeMessageOut();
      shipmentNoticeMessage.copyValues(packingList);
      this.fillShipmentNoticeMessageSupplierInfo(shipmentNoticeMessage);
      shipmentNoticeMessage.isEdit = packingList.previouslySent;
      await this.fileOutputService.outputShipmentNoticeMessageOut(
        shipmentNoticeMessage,
      );
      packingList.previouslySent = true;
    }
    shipment.status = ShipmentStatusType.NOTIFIED;
    await this.doShipmentUpdate(shipment);
    await this.doPackingListsUpdate(shipment);
  }

  async getFullShipmentById(id: number) {
    const shipmentRequest = makeEntityCrudRequest<Shipment>();
    shipmentRequest.parsed.search = {
      id: { $eq: id },
    };
    shipmentRequest.options.query = {
      join: {
        packingLists: { eager: true, alias: 'pl' },
        'packingLists.packages': { eager: true, alias: 'pak' },
        'packingLists.packages.packingList': { eager: true },
        shipmentPackages: { eager: true },
        customsDocuments: { eager: true },
      },
    };
    return this.shipmentService.getOne(shipmentRequest);
  }

  async getShipmentForShipmentNotice(id: number) {
    const shipmentRequest = makeEntityCrudRequest<Shipment>();
    shipmentRequest.parsed.search = {
      id: { $eq: id },
    };
    // Looks like aliases need to be the same everywhere you join the same stuff
    shipmentRequest.options.query = {
      join: {
        packingLists: { eager: true, alias: 'pl' },
        'packingLists.shipment': { eager: true, alias: 'sh' },
        'packingLists.purchaseOrders': { eager: true, alias: 'plpo' },
        'packingLists.packages': { eager: true, alias: 'pak' },
        'packingLists.packages.packageLines': { eager: true, alias: 'pklin' },
        'packingLists.packages.shipmentPackage': {
          eager: true,
          alias: 'shipk',
        },
        'packingLists.packages.packageLines.lineItem': {
          eager: true,
          alias: 'lin',
        },
        'packingLists.packages.packageLines.lineItem.purchaseOrder': {
          eager: true,
          alias: 'po',
        },
      },
    };
    return this.shipmentService.getOne(shipmentRequest);
  }

  async getShipmentForCartonLabels(id: number) {
    const shipmentRequest = makeEntityCrudRequest<Shipment>();
    shipmentRequest.parsed.search = {
      id: { $eq: id },
    };
    shipmentRequest.options.query.join = {
      packingLists: { eager: true, alias: 'pl' },
      'packingLists.packages': { eager: true, alias: 'pak' },
      'packingLists.packages.packageLines': { eager: true, alias: 'pklin' },
      'packingLists.packages.shipmentPackage': { eager: true, alias: 'shipk' },
      'packingLists.packages.packageLines.lineItem': {
        eager: true,
        alias: 'lin',
      },
    };
    return this.shipmentService.getOne(shipmentRequest);
  }

  fillShipmentNoticeMessageSupplierInfo(
    shipmentNoticeMessage: ShipmentNoticeMessageOut,
  ) {
    shipmentNoticeMessage.shipFromCountryCode = this.configService.get(
      'SUPPLIER_COUNTRY_CODE',
    );
    shipmentNoticeMessage.shipFromGLN = this.configService.get('SUPPLIER_GLN');
    shipmentNoticeMessage.shipFromPostalCode =
      this.configService.get('SUPPLIER_POSTCODE');
    shipmentNoticeMessage.supplierGLN = this.configService.get('SUPPLIER_GLN');
  }

  async doShipmentUpdate(shipment: Shipment): Promise<Shipment> {
    const saveQuery = makeEntityCrudRequest<Shipment>();
    return this.shipmentService.updateOne(saveQuery, shipment);
  }

  async doPackingListsUpdate(shipment: Shipment): Promise<PackingList[]> {
    const saveQuery = makeEntityCrudRequest<PackingList>();
    return Promise.all(
      shipment.packingLists.map((packingList) =>
        this.packingListService.updateOne(saveQuery, packingList),
      ),
    );
  }

  async doShipmentPackageUpdate(
    shipmentPackage: ShipmentPackage,
  ): Promise<ShipmentPackage> {
    const saveQuery = makeEntityCrudRequest<ShipmentPackage>();
    return this.shipmentPackageService.updateOne(saveQuery, shipmentPackage);
  }
}

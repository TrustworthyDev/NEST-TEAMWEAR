import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PackingList } from './entities/packing-list.entity';
import { PackingListMessageIn } from './dto/packing-list-message-in';
import { PurchaseOrder } from 'src/purchase-order/entities/purchase-order.entity';
import { PurchaseOrderService } from 'src/purchase-order/purchase-order.service';
import { copyValues, dedupeReduce } from 'src/common/util/misc-util';
import { PackingListStatusType } from './enum/packing-list-status-type.enum';
import { PackageMessageIn } from 'src/package/dto/package-message-in';
import { Package } from 'src/package/entities/package.entity';
import { PackageMessageLineIn } from 'src/package-line/dto/package-message-line-in';
import { PackageLine } from 'src/package-line/entities/package-line.entity';
import { LineItemService } from 'src/line-item/line-item.service';
import { makeEntityCrudRequest } from 'src/common/util/crud-request-util';
import { PackingListService } from './packing-list.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AppEvents } from 'src/common/event/app-events';
import { OrderResponseMessageIn } from 'src/purchase-order-acknowledgement/dto/order-response-message-in';
import { groupArrayByFunction } from 'src/common/util/misc-util';
import { PurchaseOrderAcknowledgementService } from 'src/purchase-order-acknowledgement/purchase-order-acknowledgement.service';
import { PackageLineService } from 'src/package-line/package-line.service';
import { PackageService } from 'src/package/package.service';

@Injectable()
export class PackingListLifecycleService {
  constructor(
    private readonly packingListService: PackingListService,
    private readonly purchaseOrderService: PurchaseOrderService,
    private readonly lineItemService: LineItemService,
    private readonly eventEmitter: EventEmitter2,
    private readonly purchaseOrderAcknowledgementService: PurchaseOrderAcknowledgementService,
    private readonly packageService: PackageService,
    private readonly packageLineService: PackageLineService,
  ) {}

  private readonly logger = new Logger(PackingListLifecycleService.name);

  async handlePackingListMessage(
    packingListMessage: PackingListMessageIn,
  ): Promise<PackingList> {
    const dedupedMessage =
      this.dedupePackingListMessageLines(packingListMessage);

    let existingPackingList: PackingList;
    try {
      existingPackingList = await this.getPackingListByDocumentNumber(
        dedupedMessage.documentNumber,
      );
    } catch (err) {
      existingPackingList = undefined;
    }

    if (existingPackingList) {
      if (existingPackingList.status === PackingListStatusType.SHIPPED) {
        throw new BadRequestException(
          `Cannot overwrite a packingList with SHIPPED status: ${existingPackingList.documentNumber}`,
        );
      }
    }

    let purchaseOrders: PurchaseOrder[];
    try {
      purchaseOrders =
        await this.purchaseOrderService.getPurchaseOrdersByOrderNumbers(
          new Set(
            dedupedMessage.packages
              .map((pak) => pak.lineItems)
              .flat()
              .map((lin) => lin.orderNumber),
          ),
        );
    } catch (e) {
      this.logger.error(e.getResponse().message);
      throw e;
    }

    await this.updatePurchaseOrderAcknowledgementsFromPackingListMessage(
      dedupedMessage,
    );

    const packingList = await this.createPackingList(
      dedupedMessage,
      purchaseOrders,
    );

    if (existingPackingList) {
      packingList.previouslySent = existingPackingList.previouslySent;
      await this.removeFullPackingList(existingPackingList);
    } else {
      packingList.previouslySent = false;
    }

    const saved = await this.doPackingListCreate(packingList);

    return saved;
  }

  async updatePurchaseOrderAcknowledgementsFromPackingListMessage(
    packingListMessage: PackingListMessageIn,
  ) {
    const lineMessages = packingListMessage.packages
      .map((pack) => pack.lineItems)
      .flat();
    // There may be multiple lines for the same item in the same order, this adds them together
    const linesAggregated = dedupeReduce(
      lineMessages,
      (lineIn) => lineIn.orderNumber + '_' + lineIn.itemNumber,
      (acc, curr) => {
        acc.shippedQuantity += curr.shippedQuantity;
        return acc;
      },
      (groupName, group) => ({
        orderNumber: group[0].orderNumber,
        itemNumber: group[0].itemNumber,
        shippedQuantity: 0,
      }),
    );

    const orderNumbersToLineMessagesMap = groupArrayByFunction(
      linesAggregated,
      (lineIn) => lineIn.orderNumber,
    );

    const updateMessages = await Promise.all(
      Array.from(orderNumbersToLineMessagesMap.entries()).map(
        ([orderNumber, lineItems]) =>
          this.getPurchaseOrderAcknowledgementUpdateMessageFromLineItems(
            orderNumber,
            lineItems,
          ),
      ),
    );

    const updatePromises = updateMessages.map((message) =>
      this.eventEmitter.emitAsync(
        AppEvents.PURCHASE_ORDER_ACKNOWLEDGEMENT_MESSAGE,
        message,
      ),
    );

    try {
      await Promise.all(updatePromises);
    } catch (e) {
      throw new BadRequestException(
        `POA update from packing list failed: ${e.message}`,
      );
    }
  }

  async getPurchaseOrderAcknowledgementUpdateMessageFromLineItems(
    orderNumber: string,
    lineItems: PackageMessageLineIn[],
  ) {
    const purchaseOrderAcknowledgement =
      await this.purchaseOrderAcknowledgementService.getFullPurchaseOrderAcknowledgement(
        orderNumber,
      );
    const itemNumbersToLineItemsMap = groupArrayByFunction(
      purchaseOrderAcknowledgement.lineItemAcknowledgements,
      (lineAck) => lineAck.lineItem.itemNumber,
    );
    const updateMessage: OrderResponseMessageIn = {
      isEmpty: () => false,
      orderNumber,
      amazonVendorCode:
        purchaseOrderAcknowledgement.purchaseOrder.amazonVendorCode,
      deliveryDateStart:
        purchaseOrderAcknowledgement.purchaseOrder.deliveryDateStart,
      deliveryDateEnd:
        purchaseOrderAcknowledgement.purchaseOrder.deliveryDateEnd,
      shipToGLN: purchaseOrderAcknowledgement.purchaseOrder.shipToGLN,
      lineItems: lineItems.map((packLineIn) => ({
        itemNumber: packLineIn.itemNumber,
        netPrice: itemNumbersToLineItemsMap.get(packLineIn.itemNumber)[0]
          .netPrice,
        orderedQuantity: packLineIn.shippedQuantity,
      })),
    };
    return updateMessage;
  }

  async getPackingListByDocumentNumber(documentNumber: string) {
    const request = makeEntityCrudRequest<PackingList>();
    request.parsed.search = {
      documentNumber: { $eq: documentNumber },
    };
    request.options.query.join = {
      packages: { eager: true },
      'packages.packageLines': { eager: true },
    };
    return this.packingListService.getOne(request);
  }

  async createPackingList(
    packingListMessage: PackingListMessageIn,
    purchaseOrders: PurchaseOrder[],
  ) {
    const packingList = new PackingList();
    packingList.purchaseOrders = [...purchaseOrders];
    copyValues(packingList, packingListMessage, [
      'documentNumber',
      'shipToName',
      'shipToGLN',
      'shipToAddressLine1',
      'shipToAddressLine2',
      'shipToCity',
      'shipToCountryCode',
      'shipToPostalCode',
    ]);
    packingList.receivedDate = new Date();
    packingList.packages = await this.createPackages(
      packingListMessage.packages,
    );
    packingList.totalItems = packingList.packages
      .map((pck) => pck.packageLines)
      .flat()
      .reduce((prev, curr) => prev + curr.shippedQuantity, 0);
    packingList.status = PackingListStatusType.RECEIVED;
    return packingList;
  }

  async createPackages(packageMessages: PackageMessageIn[]) {
    return Promise.all(
      packageMessages.map(async (packageMessage) => {
        const thePackage = new Package();
        copyValues(thePackage, packageMessage, [
          'packageNumber',
          'SSCC',
          'width',
          'length',
          'height',
          'weight',
        ]);
        thePackage.packageLines = await this.createPackageLines(
          packageMessage.lineItems,
        );
        return thePackage;
      }),
    );
  }

  async createPackageLines(packageLineMessages: PackageMessageLineIn[]) {
    return Promise.all(
      packageLineMessages.map(async (packageLineMessage) => {
        const packageLine = new PackageLine();
        copyValues(packageLine, packageLineMessage, ['shippedQuantity']);
        packageLine.lineItem =
          await this.lineItemService.getLineItemByOrderNumberAndItemNumber(
            packageLineMessage.orderNumber,
            packageLineMessage.itemNumber,
          );
        return packageLine;
      }),
    );
  }

  dedupePackingListMessageLines(
    packingListMessage: PackingListMessageIn,
  ): PackingListMessageIn {
    const result = new PackingListMessageIn();
    copyValues(result, packingListMessage, [
      'documentNumber',
      'shipToName',
      'shipToGLN',
      'shipToAddressLine1',
      'shipToAddressLine2',
      'shipToCity',
      'shipToCountryCode',
      'shipToPostalCode',
    ]);
    result.packages = this.dedupePackageLines(packingListMessage.packages);
    return result;
  }

  dedupePackageLines(packages: PackageMessageIn[]): PackageMessageIn[] {
    return packages.map((thePackage) => {
      const result = new PackageMessageIn();
      copyValues(result, thePackage, [
        'packageNumber',
        'weight',
        'width',
        'length',
        'height',
        'SSCC',
      ]);
      result.lineItems = dedupeReduce(
        thePackage.lineItems,
        (line) => line.orderNumber + '_' + line.itemNumber,
        (acc, curr) => {
          acc.shippedQuantity += curr.shippedQuantity;
          return acc;
        },
        (groupName, group) => {
          const initial = new PackageMessageLineIn();
          copyValues(initial, group[0], ['itemNumber', 'orderNumber']);
          initial.shippedQuantity = 0;
          return initial;
        },
      );
      return result;
    });
  }

  async doPackingListCreate(packingList: PackingList) {
    const saveQuery = makeEntityCrudRequest<PackingList>();
    return this.packingListService.createOne(saveQuery, packingList);
  }

  async removeFullPackingList(packingList: PackingList) {
    for (const pck of packingList.packages) {
      for (const lin of pck.packageLines) {
        const request = makeEntityCrudRequest<PackageLine>();
        request.parsed.search = { id: { $eq: lin.id } };
        await this.packageLineService.deleteOne(request);
      }
      const request = makeEntityCrudRequest<Package>();
      request.parsed.search = { id: { $eq: pck.id } };
      await this.packageService.deleteOne(request);
    }
    const updateRequest = makeEntityCrudRequest<PackingList>();
    await this.packingListService.updateOne(updateRequest, {
      id: packingList.id,
      purchaseOrders: [],
    });
    const deleteRequest = makeEntityCrudRequest<PackingList>();
    deleteRequest.parsed.search = { id: { $eq: packingList.id } };
    await this.packingListService.deleteOne(deleteRequest);
  }
}

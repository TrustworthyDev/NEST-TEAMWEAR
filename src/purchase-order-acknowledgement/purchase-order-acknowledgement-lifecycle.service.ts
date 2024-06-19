import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { AppEvents } from 'src/common/event/app-events';
import { makeEntityCrudRequest } from 'src/common/util/crud-request-util';
import {
  copyValues,
  dedupeReduce,
  groupArrayByFunction,
} from 'src/common/util/misc-util';
import { FileOutputService } from 'src/file-output/file-output.service';
import { LineItemOrderResponseMessageIn } from 'src/line-item-acknowledgement/dto/line-item-order-response-message-in';
import { LineItemAcknowledgement } from 'src/line-item-acknowledgement/entities/line-item-acknowledgement.entity';
import { LineItemAcknowledgementStatusType } from 'src/line-item-acknowledgement/enum/line-item-acknowledgement-status-type.enum';
import { OrderAcknowledgementMessageOut } from './dto/order-acknowledgement-message-out';
import { OrderResponseMessageIn } from './dto/order-response-message-in';
import { PurchaseOrderAcknowledgement } from './entities/purchase-order-acknowledgement.entity';
import { PurchaseOrderAcknowledgementStatusType } from './enum/purchase-order-acknowledgement-status-type.enum';
import { PurchaseOrderAcknowledgementService } from './purchase-order-acknowledgement.service';

@Injectable()
export class PurchaseOrderAcknowledgementLifecycleService {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly purchaseOrderAcknowledgementService: PurchaseOrderAcknowledgementService,
    private readonly fileOutputService: FileOutputService,
  ) {}

  private readonly logger = new Logger(
    PurchaseOrderAcknowledgementLifecycleService.name,
  );

  @OnEvent(AppEvents.PURCHASE_ORDER_ACKNOWLEDGEMENT_MESSAGE)
  public async handleResponseMessage(
    responseMessage: OrderResponseMessageIn,
  ): Promise<PurchaseOrderAcknowledgement> {
    const purchaseOrderAcknowledgement =
      await this.purchaseOrderAcknowledgementService.getFullPurchaseOrderAcknowledgement(
        responseMessage.orderNumber,
      );
    const itemNumberTolineAckMap = this.filterAndMapLineAcks(
      purchaseOrderAcknowledgement,
    );
    const dedupedMessage = this.dedupeLineItemResponses(responseMessage);
    this.checkResponseConsistency(
      purchaseOrderAcknowledgement,
      dedupedMessage,
      itemNumberTolineAckMap,
    );
    const isPOAChanged = this.updateLineItemAcknowledgements(
      itemNumberTolineAckMap,
      dedupedMessage,
    );
    if (isPOAChanged) {
      purchaseOrderAcknowledgement.status =
        PurchaseOrderAcknowledgementStatusType.COMPLETE;

      const saved = await this.doPurchaseOrderAcknowledgementSave(
        purchaseOrderAcknowledgement,
      );

      this.eventEmitter.emit(
        AppEvents.PURCHASE_ORDER_ACKNOWLEDGEMENT_COMPLETE,
        dedupedMessage.orderNumber,
      );

      return saved;
    }
    return purchaseOrderAcknowledgement;
  }

  @OnEvent(AppEvents.PURCHASE_ORDER_ACKNOWLEDGEMENT_COMPLETE)
  public async onPurchaseOrderAcknowledgementComplete(
    purchaseOrderNumber: string,
  ) {
    let purchaseOrderAcknowledgement: PurchaseOrderAcknowledgement;
    try {
      purchaseOrderAcknowledgement =
        await this.purchaseOrderAcknowledgementService.getFullPurchaseOrderAcknowledgement(
          purchaseOrderNumber,
        );
    } catch {
      this.logger.error(
        `PurchaseOrderAcknowledgement not found for order ${purchaseOrderNumber}`,
        new Error().stack,
      );
      return;
    }

    const acknowledgementMessage = new OrderAcknowledgementMessageOut();
    acknowledgementMessage.copyValues(purchaseOrderAcknowledgement);
    await this.fileOutputService.outputOrderAcknowledgementMessageOut(
      acknowledgementMessage,
    );

    purchaseOrderAcknowledgement.status =
      PurchaseOrderAcknowledgementStatusType.FORWARDED;
    await this.doPurchaseOrderAcknowledgementSave(purchaseOrderAcknowledgement);
  }

  async doPurchaseOrderAcknowledgementSave(
    purchaseOrderAcknowledgement: PurchaseOrderAcknowledgement,
  ) {
    const saveQuery = makeEntityCrudRequest<PurchaseOrderAcknowledgement>();
    const saved = await this.purchaseOrderAcknowledgementService.updateOne(
      saveQuery,
      purchaseOrderAcknowledgement,
    );
    return saved;
  }

  /**
   *
   * @param itemNumberTolineAckMap The LineItemAcks contained are updated directly
   * @param responseMessage
   * @returns true if the update message caused changes, false if nothing changed
   */
  updateLineItemAcknowledgements(
    itemNumberTolineAckMap: Map<string, LineItemAcknowledgement[]>,
    responseMessage: OrderResponseMessageIn,
  ): boolean {
    let hasChanges = false;
    const workingMap = new Map(itemNumberTolineAckMap);
    if (!responseMessage.isEmpty()) {
      for (const resp of responseMessage.lineItems) {
        const ack = workingMap.get(resp.itemNumber)[0];
        if (
          ack.status === LineItemAcknowledgementStatusType.COMPLETE &&
          resp.orderedQuantity > ack.quantityDispatching
        ) {
          throw new BadRequestException(
            'Invalid accept quantity in response message',
            `trying to accept ${resp.itemNumber} ${resp.orderedQuantity} but previously accepted ${ack.quantityDispatching}`,
          );
        }
        // only update complete acks with new quantity if the old quantity was different
        if (
          ack.status !== LineItemAcknowledgementStatusType.COMPLETE ||
          resp.orderedQuantity != ack.quantityDispatching
        ) {
          ack.quantityDispatching = resp.orderedQuantity;
          ack.quantitySoftReject =
            ack.lineItem.orderedQuantity - resp.orderedQuantity;
          ack.netPrice = resp.netPrice;
          ack.status = LineItemAcknowledgementStatusType.COMPLETE;
          hasChanges = true;
        }
        workingMap.delete(resp.itemNumber);
      }
    }

    // if some acks don't have response they are rejected completely
    if (workingMap.size > 0) {
      for (const [, [ack]] of workingMap) {
        // only update complete acks with 0 quantity if they weren't 0 already
        if (
          ack.status !== LineItemAcknowledgementStatusType.COMPLETE ||
          ack.quantityDispatching != 0
        ) {
          ack.quantityDispatching = 0;
          ack.quantitySoftReject = ack.lineItem.orderedQuantity;
          ack.netPrice = ack.lineItem.netPrice;
          ack.status = LineItemAcknowledgementStatusType.COMPLETE;
          hasChanges = true;
        }
      }
    }
    return hasChanges;
  }

  /**
   * Extracts only the LineItemAcknowledgements where status == PARTIAL
   * from given PurchaseOrderAcknowledgement, puts them in a Map associated
   * with the itemNumber they refer to.
   * Values in the Map are 1-element arrays, assuming poa didn't have
   * multiple lia per itemNumber, which it shouldn't.
   */
  filterAndMapLineAcks(
    purchaseOrderAcknowledgement: PurchaseOrderAcknowledgement,
  ) {
    return groupArrayByFunction(
      purchaseOrderAcknowledgement.lineItemAcknowledgements.filter((lia) =>
        [
          LineItemAcknowledgementStatusType.PARTIAL,
          LineItemAcknowledgementStatusType.COMPLETE,
        ].includes(lia.status),
      ),
      (lia) => lia.lineItem.itemNumber,
    );
  }

  /**
   * response must have all basic info equal to original order
   * response cannot have items that already have a complete ack
   */
  checkResponseConsistency(
    purchaseOrderAcknowledgement: PurchaseOrderAcknowledgement,
    responseMessage: OrderResponseMessageIn,
    itemNumberTolineAckMap: Map<string, LineItemAcknowledgement[]>,
  ) {
    const errors = [];
    if (!responseMessage.isEmpty()) {
      if (
        responseMessage.amazonVendorCode &&
        responseMessage.amazonVendorCode !==
          purchaseOrderAcknowledgement.purchaseOrder.amazonVendorCode
      ) {
        errors.push(
          `response amazonVendorCode mismatch. order: [${purchaseOrderAcknowledgement.purchaseOrder.amazonVendorCode}], response:[${responseMessage.amazonVendorCode}]`,
        );
      }
      for (const li of responseMessage.lineItems) {
        const lineAckList = itemNumberTolineAckMap.get(li.itemNumber);
        if (!lineAckList) {
          errors.push(
            `response lineItem mismatch. Item [${li.itemNumber}] is not in order`,
          );
        } else {
          if (li.orderedQuantity > lineAckList[0].lineItem.orderedQuantity) {
            errors.push(
              `response quantity mismatch. Item [${li.itemNumber}] is accepted in higher quantity than requested`,
            );
          }
        }
      }
    }
    if (errors.length > 0) {
      errors.push(
        `OrderNumber: [${purchaseOrderAcknowledgement.purchaseOrder.orderNumber}]`,
      );
      throw new BadRequestException(
        `Bad POA from Mexal (${errors.length - 1} errors)`,
        errors.join('\n'),
      );
    }
  }

  /**
   * Response message can have more line item reponses for the same product.
   * At the end there should only be one line item response per product,
   * which is the sum of all lines referencing that product.
   */
  dedupeLineItemResponses(
    responseMessage: OrderResponseMessageIn,
  ): OrderResponseMessageIn {
    const result = new OrderResponseMessageIn();
    copyValues(result, responseMessage, [
      'orderNumber',
      'amazonVendorCode',
      'deliveryDateStart',
      'deliveryDateEnd',
      'shipToGLN',
    ]);

    if (!responseMessage.isEmpty()) {
      result.lineItems = dedupeReduce(
        responseMessage.lineItems,
        (lineIn) => lineIn.itemNumber,
        (acc, curr) => {
          if (acc.netPrice !== curr.netPrice) {
            throw new BadRequestException(
              'Price mismatch in response message',
              `Response for order ${responseMessage.orderNumber} contains different prices for item ${acc.itemNumber}`,
            );
          }
          acc.orderedQuantity += curr.orderedQuantity;
          return acc;
        },
        (groupName, group) => {
          const initial = new LineItemOrderResponseMessageIn();
          copyValues(initial, group[0], ['itemNumber', 'netPrice']);
          initial.orderedQuantity = 0;
          return initial;
        },
      );
    }

    return result;
  }
}

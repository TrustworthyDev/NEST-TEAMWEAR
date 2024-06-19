import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test } from '@nestjs/testing';
import { FileOutputService } from 'src/file-output/file-output.service';
import { LineItemAcknowledgement } from 'src/line-item-acknowledgement/entities/line-item-acknowledgement.entity';
import { LineItemAcknowledgementStatusType } from 'src/line-item-acknowledgement/enum/line-item-acknowledgement-status-type.enum';
import { MockCrudService } from 'test/src/common/service/mock-crud.service';
import { MockEventEmitter } from 'test/src/common/service/mock-event-emitter.service';
import { MockFileOutputService } from 'test/src/common/service/mock-file-output.service';
import { OrderResponseMessageIn } from './dto/order-response-message-in';
import { PurchaseOrderAcknowledgement } from './entities/purchase-order-acknowledgement.entity';
import { PurchaseOrderAcknowledgementStatusType } from './enum/purchase-order-acknowledgement-status-type.enum';
import { PurchaseOrderAcknowledgementLifecycleService } from './purchase-order-acknowledgement-lifecycle.service';
import { PurchaseOrderAcknowledgementService } from './purchase-order-acknowledgement.service';

describe('purchase-order-acknowledgement-lifecycle-service', () => {
  let purchaseOrderAcknowledgementLifecycleService: PurchaseOrderAcknowledgementLifecycleService;
  let purchaseOrderAcknowledgementService: MockCrudService<PurchaseOrderAcknowledgement>;
  let eventEmitter: MockEventEmitter;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: EventEmitter2,
          useClass: MockEventEmitter,
        },
        {
          provide: PurchaseOrderAcknowledgementService,
          useClass: MockCrudService,
        },
        {
          provide: FileOutputService,
          useClass: MockFileOutputService,
        },
        PurchaseOrderAcknowledgementLifecycleService,
      ],
    }).compile();

    purchaseOrderAcknowledgementLifecycleService = moduleRef.get(
      PurchaseOrderAcknowledgementLifecycleService,
    );
    eventEmitter = moduleRef.get(EventEmitter2);
    purchaseOrderAcknowledgementService = moduleRef.get(
      PurchaseOrderAcknowledgementService,
    );
  });

  function makeLineAckMapElement(
    orderNumber: string,
    status: LineItemAcknowledgementStatusType,
    originalQuantity: number,
    originalPrice: number,
    acceptedQuantity: number,
    softRejectedQuantity: number,
  ): [string, LineItemAcknowledgement[]] {
    return [
      orderNumber,
      [
        {
          status: status,
          quantityDispatching: acceptedQuantity,
          quantitySoftReject: softRejectedQuantity,
          lineItem: {
            itemNumber: orderNumber,
            orderedQuantity: originalQuantity,
            netPrice: originalPrice,
          },
        } as LineItemAcknowledgement,
      ],
    ];
  }

  describe('filterAndMapLineAcks', () => {
    it('returns the correct data structure', () => {
      const poa: PurchaseOrderAcknowledgement = {
        lineItemAcknowledgements: [
          {
            lineItem: { itemNumber: '1' },
            status: LineItemAcknowledgementStatusType.COMPLETE,
          },
          {
            lineItem: { itemNumber: '2' },
            status: LineItemAcknowledgementStatusType.PARTIAL,
          },
          {
            lineItem: { itemNumber: '3' },
            status: LineItemAcknowledgementStatusType.OBSOLETE,
          },
        ],
      } as PurchaseOrderAcknowledgement;

      const {
        lineItemAcknowledgements: [item1, item2, item3],
      } = poa;
      const {
        lineItemAcknowledgements: [
          {
            lineItem: { itemNumber: itemNumber1 },
          },
          {
            lineItem: { itemNumber: itemNumber2 },
          },
          {
            lineItem: { itemNumber: itemNumber3 },
          },
        ],
      } = poa;
      const result =
        purchaseOrderAcknowledgementLifecycleService.filterAndMapLineAcks(poa);

      expect(result.get(itemNumber1)).toBeDefined();
      expect(result.get(itemNumber1).length).toEqual(1);
      expect(result.get(itemNumber1)[0]).toBe(item1);
      expect(result.get(itemNumber2)).toBeDefined();
      expect(result.get(itemNumber2).length).toEqual(1);
      expect(result.get(itemNumber2)[0]).toBe(item2);
      expect(result.get(itemNumber3)).toBeUndefined();
    });

    it.todo('throws if the the input is malformed');
  });

  describe('updateLineItemAcknowledgements', () => {
    const PARTIAL = LineItemAcknowledgementStatusType.PARTIAL;
    const COMPLETE = LineItemAcknowledgementStatusType.COMPLETE;

    it('handles empty response message correctly', () => {
      const lineAckMap = new Map<string, LineItemAcknowledgement[]>([
        makeLineAckMapElement('1', PARTIAL, 3, 13.4, 0, 0),
        makeLineAckMapElement('2', COMPLETE, 5, 7, 3, 2),
      ]);
      const responseMessage: OrderResponseMessageIn = {
        isEmpty: () => true,
      } as OrderResponseMessageIn;

      const hasChanges =
        purchaseOrderAcknowledgementLifecycleService.updateLineItemAcknowledgements(
          lineAckMap,
          responseMessage,
        );

      expect(hasChanges).toBe(true);
      expect(lineAckMap.get('1')[0]).toHaveProperty('quantitySoftReject', 3);
      expect(lineAckMap.get('1')[0]).toHaveProperty('netPrice', 13.4);
      expect(lineAckMap.get('1')[0]).toHaveProperty(
        'status',
        LineItemAcknowledgementStatusType.COMPLETE,
      );
      expect(lineAckMap.get('2')[0]).toHaveProperty('quantitySoftReject', 5);
      expect(lineAckMap.get('2')[0]).toHaveProperty('netPrice', 7);
      expect(lineAckMap.get('2')[0]).toHaveProperty(
        'status',
        LineItemAcknowledgementStatusType.COMPLETE,
      );
    });

    it('updates lineItemAcknowledgements correctly', () => {
      const lineAckMap = new Map<string, LineItemAcknowledgement[]>([
        makeLineAckMapElement('1', PARTIAL, 3, 13.4, 0, 0),
        makeLineAckMapElement('2', PARTIAL, 5, 10, 0, 0),
        makeLineAckMapElement('3', PARTIAL, 3, 7, 0, 0),
        makeLineAckMapElement('4', PARTIAL, 3, 7, 0, 0),
        makeLineAckMapElement('5', PARTIAL, 2, 2.5, 0, 0),
        makeLineAckMapElement('6', COMPLETE, 5, 7, 3, 2),
        makeLineAckMapElement('7', COMPLETE, 5, 7, 3, 2),
      ]);

      const responseMessage: OrderResponseMessageIn = {
        isEmpty: () => false,
        lineItems: [
          // accept all
          { itemNumber: '1', orderedQuantity: 3, netPrice: 13.4 },
          // accept some
          { itemNumber: '2', orderedQuantity: 3, netPrice: 10 },
          // lower price
          { itemNumber: '3', orderedQuantity: 3, netPrice: 5 },
          // raise price
          { itemNumber: '4', orderedQuantity: 3, netPrice: 17 },
          // reject '5' completely
          // accept '6' with a lower amount than previously accepted
          { itemNumber: '6', orderedQuantity: 1, netPrice: 7 },
          // reject '7' completely after having accepted it previously
        ],
      } as OrderResponseMessageIn;

      purchaseOrderAcknowledgementLifecycleService.updateLineItemAcknowledgements(
        lineAckMap,
        responseMessage,
      );

      const results = Array.from(lineAckMap.values()).map((val) => {
        delete val[0].lineItem;
        return val[0];
      });

      expect(results[0]).toEqual({
        quantityDispatching: 3,
        quantitySoftReject: 0,
        netPrice: 13.4,
        status: COMPLETE,
      });
      expect(results[1]).toEqual({
        quantityDispatching: 3,
        quantitySoftReject: 2,
        netPrice: 10,
        status: COMPLETE,
      });
      expect(results[2]).toEqual({
        quantityDispatching: 3,
        quantitySoftReject: 0,
        netPrice: 5,
        status: COMPLETE,
      });
      expect(results[3]).toEqual({
        quantityDispatching: 3,
        quantitySoftReject: 0,
        netPrice: 17,
        status: COMPLETE,
      });
      expect(results[4]).toEqual({
        quantityDispatching: 0,
        quantitySoftReject: 2,
        netPrice: 2.5,
        status: COMPLETE,
      });
      expect(results[5]).toEqual({
        quantityDispatching: 1,
        quantitySoftReject: 4,
        netPrice: 7,
        status: COMPLETE,
      });
      expect(results[6]).toEqual({
        quantityDispatching: 0,
        quantitySoftReject: 5,
        netPrice: 7,
        status: COMPLETE,
      });
    });

    it('throws if trying to acknowledge more items than previously acknowledged', () => {
      const lineAckMap = new Map<string, LineItemAcknowledgement[]>([
        makeLineAckMapElement('1', COMPLETE, 5, 7, 3, 2),
      ]);

      const responseMessage = {
        isEmpty: () => false,
        lineItems: [{ itemNumber: '1', orderedQuantity: 4, netPrice: 7 }],
      } as OrderResponseMessageIn;

      expect(() =>
        purchaseOrderAcknowledgementLifecycleService.updateLineItemAcknowledgements(
          lineAckMap,
          responseMessage,
        ),
      ).toThrow('Invalid accept quantity in response message');
    });

    it('reports no changes if an update message caused no changes to the previous quantities', () => {
      const lineAckMap = new Map<string, LineItemAcknowledgement[]>([
        makeLineAckMapElement('1', COMPLETE, 10, 1, 10, 0),
        makeLineAckMapElement('2', COMPLETE, 10, 1, 5, 5),
        makeLineAckMapElement('3', COMPLETE, 10, 1, 0, 10),
      ]);

      const responseMessage: OrderResponseMessageIn = {
        isEmpty: () => false,
        lineItems: [
          // accept all, as it already was
          { itemNumber: '1', orderedQuantity: 10, netPrice: 1 },
          // accept some, as it already was
          { itemNumber: '2', orderedQuantity: 5, netPrice: 1 },
          // reject all, as it already was
        ],
      } as OrderResponseMessageIn;

      const hasChanges =
        purchaseOrderAcknowledgementLifecycleService.updateLineItemAcknowledgements(
          lineAckMap,
          responseMessage,
        );

      expect(hasChanges).toBe(false);
    });
  });

  describe('dedupeLineItemResponses', () => {
    it('does nothing if no dupes', () => {
      const responseMessage: OrderResponseMessageIn = {
        isEmpty: () => false,
        orderNumber: 'ABC',
        amazonVendorCode: 'GGVFC',
        lineItems: [
          { itemNumber: '123', orderedQuantity: 3, netPrice: 13.5 },
          { itemNumber: '456', orderedQuantity: 12, netPrice: 2.23 },
          { itemNumber: '789', orderedQuantity: 1, netPrice: 1 },
        ],
      } as OrderResponseMessageIn;

      const newReponse =
        purchaseOrderAcknowledgementLifecycleService.dedupeLineItemResponses(
          responseMessage,
        );

      delete responseMessage.isEmpty;

      expect(newReponse).toEqual(responseMessage);
    });

    it('aggregates dupes into single line responses', () => {
      const responseMessage: OrderResponseMessageIn = {
        isEmpty: () => false,
        orderNumber: 'ABC',
        amazonVendorCode: 'GGVFC',
        lineItems: [
          { itemNumber: '123', orderedQuantity: 3, netPrice: 13.5 },
          { itemNumber: '456', orderedQuantity: 12, netPrice: 2.23 },
          { itemNumber: '789', orderedQuantity: 1, netPrice: 1 },
          { itemNumber: '456', orderedQuantity: 4, netPrice: 2.23 },
        ],
      } as OrderResponseMessageIn;

      const newReponse =
        purchaseOrderAcknowledgementLifecycleService.dedupeLineItemResponses(
          responseMessage,
        );

      const expectedResult: OrderResponseMessageIn = {
        orderNumber: 'ABC',
        amazonVendorCode: 'GGVFC',
        lineItems: [
          { itemNumber: '123', orderedQuantity: 3, netPrice: 13.5 },
          { itemNumber: '456', orderedQuantity: 16, netPrice: 2.23 },
          { itemNumber: '789', orderedQuantity: 1, netPrice: 1 },
        ],
      } as OrderResponseMessageIn;

      expect(newReponse).toEqual(expectedResult);
    });

    it('does nothing for empty responses', () => {
      const responseMessage: OrderResponseMessageIn = {
        isEmpty: () => true,
        orderNumber: 'ABC',
      } as OrderResponseMessageIn;

      const newResponse =
        purchaseOrderAcknowledgementLifecycleService.dedupeLineItemResponses(
          responseMessage,
        );

      delete responseMessage.isEmpty;

      expect(newResponse).toEqual(responseMessage);
    });

    it('throws if two repeated line responses have different prices', () => {
      const responseMessage: OrderResponseMessageIn = {
        isEmpty: () => false,
        orderNumber: 'ABC',
        amazonVendorCode: 'GGVFC',
        lineItems: [
          { itemNumber: '123', orderedQuantity: 3, netPrice: 13.5 },
          { itemNumber: '456', orderedQuantity: 12, netPrice: 2.23 },
          { itemNumber: '789', orderedQuantity: 1, netPrice: 1 },
          { itemNumber: '456', orderedQuantity: 4, netPrice: 2.21 },
        ],
      } as OrderResponseMessageIn;

      expect(() =>
        purchaseOrderAcknowledgementLifecycleService.dedupeLineItemResponses(
          responseMessage,
        ),
      ).toThrow('Price mismatch in response message');
    });
  });
  describe('checkResponseConsistency', () => {
    it('throws if an item is accepted in higher amount than the original order', () => {
      const purchaseOrderAcknowledgement = {
        purchaseOrder: { amazonVendorCode: 'GGVFC', shipToGLN: '12345' },
        lineItemAcknowledgements: [
          { lineItem: { itemNumber: '1', orderedQuantity: 3 } },
        ],
      } as PurchaseOrderAcknowledgement;

      const responseMessage = {
        isEmpty: () => false,
        amazonVendorCode: 'GGVFC',
        shipToGLN: '12345',
        lineItems: [{ itemNumber: '1', orderedQuantity: 5, netPrice: 6 }],
      } as OrderResponseMessageIn;

      const lineAckMap = new Map<string, LineItemAcknowledgement[]>([
        makeLineAckMapElement(
          '1',
          LineItemAcknowledgementStatusType.PARTIAL,
          3,
          6,
          0,
          0,
        ),
      ]);

      expect(() =>
        purchaseOrderAcknowledgementLifecycleService.checkResponseConsistency(
          purchaseOrderAcknowledgement,
          responseMessage,
          lineAckMap,
        ),
      ).toThrow('Bad POA from Mexal (1 errors)');
    });
  });
});

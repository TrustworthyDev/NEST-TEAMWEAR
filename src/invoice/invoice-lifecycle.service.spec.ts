import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test } from '@nestjs/testing';
import { FileOutputService } from 'src/file-output/file-output.service';
import { LineItem } from 'src/line-item/entities/line-item.entity';
import { LineItemService } from 'src/line-item/line-item.service';
import { PurchaseOrder } from 'src/purchase-order/entities/purchase-order.entity';
import { PurchaseOrderService } from 'src/purchase-order/purchase-order.service';
import { MockCrudService } from 'test/src/common/service/mock-crud.service';
import { MockEventEmitter } from 'test/src/common/service/mock-event-emitter.service';
import { MockFileOutputService } from 'test/src/common/service/mock-file-output.service';
import { InvoiceMessageIn } from './dto/invoice-message-in';
import { Invoice } from './entities/invoice.entity';
import { InvoiceLifecycleService } from './invoice-lifecycle.service';
import { InvoiceService } from './invoice.service';

describe('invoice-lifecycle-service', () => {
  let invoiceLifecycleService: InvoiceLifecycleService;
  let invoiceService: MockCrudService<Invoice>;
  let eventEmitter: MockEventEmitter;
  let purchaseOrderService: MockCrudService<PurchaseOrder>;
  let lineItemService: MockCrudService<LineItem>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [
        { provide: EventEmitter2, useClass: MockEventEmitter },
        { provide: InvoiceService, useClass: MockCrudService },
        { provide: FileOutputService, useClass: MockFileOutputService },
        { provide: PurchaseOrderService, useClass: MockCrudService },
        { provide: LineItemService, useClass: MockCrudService },
        InvoiceLifecycleService,
      ],
    }).compile();
    invoiceLifecycleService = moduleRef.get(InvoiceLifecycleService);
    eventEmitter = moduleRef.get(EventEmitter2);
    invoiceService = moduleRef.get(InvoiceService);
  });

  describe('checkResponseConsistency', () => {
    it('throws if some of the purchaseOrders from this invoice have different invoiceeGLN', () => {
      const purchaseOrders = [
        { invoiceeGLN: '0001' },
        { invoiceeGLN: '0002' },
      ] as PurchaseOrder[];
      const invoiceMessage = {
        lineItems: [{ orderNumber: '0001' }, { orderNumber: '0002' }],
      } as InvoiceMessageIn;

      expect(() =>
        invoiceLifecycleService.checkResponseConsistency(
          purchaseOrders,
          invoiceMessage,
        ),
      ).toThrow('Bad invoice from Mexal (1 errors)');
    });
  });

  describe('dedupeInvoiceMessageLines', () => {
    it('retains all important info', () => {
      const invoiceMessage: InvoiceMessageIn = {
        invoiceNumber: 'abc',
        invoiceeAddress: 'VIA DA QUI, 1',
        invoiceeCityName: 'NOWHERE',
        invoiceeName: 'RETAILER S.P.A.',
        invoiceePostcode: '82102',
        invoiceeVATNumber: 'DE384893939',
        invoiceTotal: 1234.34,
        lineItems: [
          {
            invoicedQuantity: 3,
            itemNumber: '1234',
            netPrice: 23.5,
            orderNumber: 'AAAABBBB',
            taxRate: 22,
            totalNetPrice: 70.5,
          },
        ],
        taxPointDate: '20230228',
        VATSummaries: [{ taxableAmount: 70.5, taxAmount: 15.51, VATRate: 22 }],
      } as InvoiceMessageIn;

      const newMessage =
        invoiceLifecycleService.dedupeInvoiceMessageLines(invoiceMessage);

      expect(newMessage).toEqual(invoiceMessage);
    });

    it('aggregates dupes into single invoice lines', () => {
      const invoiceMessage: InvoiceMessageIn = {
        invoiceNumber: 'abc',
        lineItems: [
          {
            orderNumber: 'AAAAAAAA',
            itemNumber: '0123',
            invoicedQuantity: 4,
            totalNetPrice: 40.8,
            netPrice: 10.2,
            taxRate: 22,
          },
          {
            orderNumber: 'AAAABBBB',
            itemNumber: '0124',
            invoicedQuantity: 1,
            totalNetPrice: 9.99,
            netPrice: 9.99,
            taxRate: 22,
          },
          {
            orderNumber: 'AAAAAAAA',
            itemNumber: '0123',
            invoicedQuantity: 2,
            totalNetPrice: 20.4,
            netPrice: 10.2,
            taxRate: 22,
          },
        ],
      } as InvoiceMessageIn;

      const newMessage =
        invoiceLifecycleService.dedupeInvoiceMessageLines(invoiceMessage);

      const expectedResult: InvoiceMessageIn = {
        invoiceNumber: 'abc',
        lineItems: [
          {
            orderNumber: 'AAAAAAAA',
            itemNumber: '0123',
            invoicedQuantity: 6,
            totalNetPrice: 61.2,
            netPrice: 10.2,
            taxRate: 22,
          },
          {
            orderNumber: 'AAAABBBB',
            itemNumber: '0124',
            invoicedQuantity: 1,
            totalNetPrice: 9.99,
            netPrice: 9.99,
            taxRate: 22,
          },
        ],
      } as InvoiceMessageIn;

      expect(newMessage).toEqual(expectedResult);
    });

    it('does not aggregate the same item in different orders', () => {
      const invoiceMessage: InvoiceMessageIn = {
        invoiceNumber: 'abc',
        lineItems: [
          {
            orderNumber: 'AAAAAAAA',
            itemNumber: '0123',
            invoicedQuantity: 4,
            totalNetPrice: 40.8,
            netPrice: 10.2,
            taxRate: 22,
          },
          {
            orderNumber: 'AAAABBBB',
            itemNumber: '0123',
            invoicedQuantity: 1,
            totalNetPrice: 9.99,
            netPrice: 9.99,
            taxRate: 22,
          },
        ],
      } as InvoiceMessageIn;

      const newMessage =
        invoiceLifecycleService.dedupeInvoiceMessageLines(invoiceMessage);

      expect(newMessage).toEqual(invoiceMessage);
    });

    it('throws if two duplicate lines have different prices', () => {
      const invoiceMessage: InvoiceMessageIn = {
        invoiceNumber: 'abc',
        lineItems: [
          {
            orderNumber: 'AAAAAAAA',
            itemNumber: '0123',
            invoicedQuantity: 4,
            totalNetPrice: 40.8,
            netPrice: 10.2,
            taxRate: 22,
          },
          {
            orderNumber: 'AAAAAAAA',
            itemNumber: '0123',
            invoicedQuantity: 1,
            totalNetPrice: 9.99,
            netPrice: 9.99,
            taxRate: 22,
          },
        ],
      } as InvoiceMessageIn;

      expect(() =>
        invoiceLifecycleService.dedupeInvoiceMessageLines(invoiceMessage),
      ).toThrow('Price mismatch in invoice message');
    });

    it('throws if two duplicate lines have different tax rates', () => {
      const invoiceMessage: InvoiceMessageIn = {
        invoiceNumber: 'abc',
        lineItems: [
          {
            orderNumber: 'AAAAAAAA',
            itemNumber: '0123',
            invoicedQuantity: 4,
            totalNetPrice: 40.8,
            netPrice: 10.2,
            taxRate: 22,
          },
          {
            orderNumber: 'AAAAAAAA',
            itemNumber: '0123',
            invoicedQuantity: 1,
            totalNetPrice: 10.2,
            netPrice: 10.2,
            taxRate: 21,
          },
        ],
      } as InvoiceMessageIn;

      expect(() =>
        invoiceLifecycleService.dedupeInvoiceMessageLines(invoiceMessage),
      ).toThrow('Tax rate mismatch in invoice message');
    });
  });
});

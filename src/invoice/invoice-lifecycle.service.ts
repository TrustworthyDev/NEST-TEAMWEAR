import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { AppEvents } from 'src/common/event/app-events';
import { InvoiceMessageIn } from './dto/invoice-message-in';
import { Invoice } from './entities/invoice.entity';
import { copyValues, dedupeReduce } from 'src/common/util/misc-util';
import { InvoiceStatusType } from './enum/invoice-status-type.enum';
import { PurchaseOrder } from 'src/purchase-order/entities/purchase-order.entity';
import { InvoiceMessageLineIn } from 'src/invoice-line/ dto/invoice-message-line-in';
import { InvoiceLine } from 'src/invoice-line/entities/invoice-line.entity';
import { makeEntityCrudRequest } from 'src/common/util/crud-request-util';
import { PurchaseOrderService } from 'src/purchase-order/purchase-order.service';
import { LineItemService } from 'src/line-item/line-item.service';
import { InvoiceMessageSummaryLineIn } from 'src/tax-line/dto/invoice-message-summary-line-in';
import { TaxLine } from 'src/tax-line/entities/tax-line.entity';
import { InvoiceService } from './invoice.service';
import { FileOutputService } from 'src/file-output/file-output.service';
import { InvoiceMessageOut } from './dto/invoice-message-out';
import { ConfigService } from '@nestjs/config';
import { ConfigKeys } from 'src/config/config-keys.enum';

@Injectable()
export class InvoiceLifecycleService {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly purchaseOrderService: PurchaseOrderService,
    private readonly lineItemService: LineItemService,
    private readonly invoiceService: InvoiceService,
    private readonly fileOutputService: FileOutputService,
    private readonly configService: ConfigService<ConfigKeys>,
  ) {}

  private readonly logger = new Logger(InvoiceLifecycleService.name);

  public async handleInvoiceMessage(
    invoiceMessage: InvoiceMessageIn,
  ): Promise<Invoice> {
    const dedupedMessage = this.dedupeInvoiceMessageLines(invoiceMessage);
    const existingInvoice = await this.invoiceService.findOne({
      where: { invoiceNumber: dedupedMessage.invoiceNumber },
    });
    if (existingInvoice) {
      throw new BadRequestException(
        `Invoice ${dedupedMessage.invoiceNumber} already exists`,
      );
    }
    let purchaseOrders: PurchaseOrder[];
    try {
      purchaseOrders =
        await this.purchaseOrderService.getPurchaseOrdersByOrderNumbers(
          new Set(dedupedMessage.lineItems.map((line) => line.orderNumber)),
        );
    } catch (e) {
      this.logger.error(e.getResponse().message);
      throw e;
    }

    this.checkResponseConsistency(purchaseOrders, dedupedMessage);

    const invoice = await this.createInvoice(dedupedMessage, purchaseOrders);
    const saved = await this.doInvoiceCreate(invoice);

    this.eventEmitter.emit(AppEvents.INVOICE_ISSUED, invoice.invoiceNumber);
    return saved;
  }

  @OnEvent(AppEvents.INVOICE_ISSUED)
  public async onInvoiceIssued(invoiceNumber: string) {
    let invoice: Invoice;
    try {
      invoice = await this.getInvoiceByInvoiceNumber(invoiceNumber);
    } catch (e) {
      if (e instanceof NotFoundException) {
        this.logger.error(
          `Invoice number ${invoiceNumber} not found`,
          new Error().stack,
        );
      } else {
        this.logger.error(e);
      }
      return;
    }

    const invoiceMessage = new InvoiceMessageOut();
    invoiceMessage.copyValues(invoice);
    this.fillOutmessageSupplierInfo(invoiceMessage);
    await this.fileOutputService.outputInvoiceMessageOut(invoiceMessage);
    invoice.status = InvoiceStatusType.FORWARDED;
    try {
      await this.doInvoiceUpdate(invoice);
    } catch {
      this.logger.error(
        `Could not update invoice number ${invoice.invoiceNumber}`,
        new Error().stack,
      );
    }
  }

  async createInvoice(
    invoiceMessage: InvoiceMessageIn,
    purchaseOrders: PurchaseOrder[],
  ) {
    const invoice = new Invoice();
    invoice.purchaseOrders = [...purchaseOrders];
    copyValues(invoice, invoiceMessage, [
      'invoiceNumber',
      'taxPointDate',
      'invoiceeGLN',
      'invoiceeName1',
      'invoiceeName2',
      'invoiceeAddress1',
      'invoiceeAddress2',
      'invoiceeCityName',
      'invoiceePostcode',
      'invoiceeCountryCode',
      'invoiceeVATNumber',
      'invoiceTotal',
    ]);
    invoice.lineItems = await this.createInvoiceLineItems(
      invoiceMessage.lineItems,
    );
    invoice.VATSummaries = await this.createVATSummaries(
      invoiceMessage.VATSummaries,
    );
    invoice.status = InvoiceStatusType.ISSUED;
    return invoice;
  }

  async createInvoiceLineItems(
    messageLines: InvoiceMessageLineIn[],
  ): Promise<InvoiceLine[]> {
    return Promise.all(
      messageLines.map(async (messageLine) => {
        const invoiceLine = new InvoiceLine();
        copyValues(invoiceLine, messageLine, [
          'invoicedQuantity',
          'totalNetPrice',
          'netPrice',
          'taxRate',
        ]);
        invoiceLine.lineItem =
          await this.lineItemService.getLineItemByOrderNumberAndItemNumber(
            messageLine.orderNumber,
            messageLine.itemNumber,
          );
        return invoiceLine;
      }),
    );
  }

  async createVATSummaries(
    summaryLines: InvoiceMessageSummaryLineIn[],
  ): Promise<TaxLine[]> {
    return summaryLines.map((summaryLine) => {
      const taxLine = new TaxLine();
      copyValues(taxLine, summaryLine, [
        'VATRate',
        'taxAmount',
        'taxableAmount',
      ]);
      return taxLine;
    });
  }

  checkResponseConsistency(
    purchaseOrders: PurchaseOrder[],
    invoiceMessage: InvoiceMessageIn,
  ) {
    const errors = [];

    if (errors.length > 0) {
      errors.push(`InvoiceNumber: [${invoiceMessage.invoiceNumber}]`);
      throw new BadRequestException(
        `Bad invoice from Mexal (${errors.length - 1} errors)`,
        errors.join('\n'),
      );
    }
  }

  fillOutmessageSupplierInfo(invoiceMessage: InvoiceMessageOut) {
    invoiceMessage.supplierGLN = this.configService.get('SUPPLIER_GLN');
    invoiceMessage.supplierName1 = this.configService.get('SUPPLIER_NAME_1');
    invoiceMessage.supplierName2 = this.configService.get('SUPPLIER_NAME_2');
    invoiceMessage.supplierAddress1 =
      this.configService.get('SUPPLIER_ADDRESS_1');
    invoiceMessage.supplierAddress2 =
      this.configService.get('SUPPLIER_ADDRESS_2');
    invoiceMessage.supplierCityName =
      this.configService.get('SUPPLIER_CITY_NAME');
    invoiceMessage.supplierPostcode =
      this.configService.get('SUPPLIER_POSTCODE');
    invoiceMessage.supplierCountryCode = this.configService.get(
      'SUPPLIER_COUNTRY_CODE',
    );
    invoiceMessage.supplierVATNumber = this.configService.get(
      'SUPPLIER_VAT_NUMBER',
    );
  }

  dedupeInvoiceMessageLines(
    invoiceMessage: InvoiceMessageIn,
  ): InvoiceMessageIn {
    const result = new InvoiceMessageIn();
    copyValues(result, invoiceMessage, [
      'invoiceNumber',
      'taxPointDate',
      'invoiceeGLN',
      'invoiceeName1',
      'invoiceeName2',
      'invoiceeAddress1',
      'invoiceeAddress2',
      'invoiceeCityName',
      'invoiceePostcode',
      'invoiceeCountryCode',
      'invoiceeVATNumber',
      'invoiceTotal',
      'VATSummaries',
    ]);

    result.lineItems = dedupeReduce(
      invoiceMessage.lineItems,
      (lineIn) => lineIn.orderNumber + '_' + lineIn.itemNumber,
      (acc, curr) => {
        if (acc.netPrice !== curr.netPrice) {
          throw new BadRequestException(
            'Price mismatch in invoice message',
            `Invoice ${invoiceMessage.invoiceNumber} contains different prices for item ${acc.itemNumber} in order ${acc.orderNumber}`,
          );
        }
        if (acc.taxRate !== curr.taxRate) {
          throw new BadRequestException(
            'Tax rate mismatch in invoice message',
            `Invoice ${invoiceMessage.invoiceNumber} contains different tax rates for item ${acc.itemNumber} in order ${acc.orderNumber}`,
          );
        }
        acc.invoicedQuantity += curr.invoicedQuantity;
        acc.totalNetPrice += Math.round(curr.totalNetPrice * 100);
        return acc;
      },
      (groupName, group) => {
        const initial = new InvoiceMessageLineIn();
        copyValues(initial, group[0], [
          'itemNumber',
          'orderNumber',
          'netPrice',
          'taxRate',
        ]);
        initial.invoicedQuantity = 0;
        initial.totalNetPrice = 0;
        return initial;
      },
    );

    for (const messageLine of result.lineItems) {
      messageLine.totalNetPrice = messageLine.totalNetPrice / 100;
    }

    return result;
  }

  async doInvoiceCreate(invoice: Invoice) {
    const saveQuery = makeEntityCrudRequest<Invoice>();
    return this.invoiceService.createOne(saveQuery, invoice);
  }

  async doInvoiceUpdate(invoice: Invoice) {
    const saveQuery = makeEntityCrudRequest<Invoice>();
    return this.invoiceService.updateOne(saveQuery, invoice);
  }

  async getInvoiceByInvoiceNumber(invoiceNumber: string): Promise<Invoice> {
    const queryRequest = makeEntityCrudRequest<Invoice>();
    queryRequest.options.query = {
      join: {
        purchaseOrders: { eager: true },
        lineItems: { eager: true, alias: 'il' },
        'lineItems.lineItem': { eager: true, alias: 'li' },
        'lineItems.lineItem.purchaseOrder': { eager: true },
        VATSummaries: { eager: true },
      },
    };
    queryRequest.parsed.search = {
      invoiceNumber: { $eq: invoiceNumber },
    };
    return this.invoiceService.getOne(queryRequest);
  }
}

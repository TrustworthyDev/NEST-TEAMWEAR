import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { InvoiceMessageLineOut } from 'src/invoice-line/ dto/invoice-message-line-out';
import { InvoiceMessageSummaryLineOut } from 'src/tax-line/dto/invoice-message-summary-line-out';
import { Invoice } from '../entities/invoice.entity';
import * as util from 'src/common/util/misc-util';
import { undefineIf } from 'src/common/util/class-transformer-util';
import { ISODatestringToYYYYMMDD } from 'src/common/util/date-util';

export class InvoiceMessageOut {
  @Exclude()
  marketplace: string;

  @Expose()
  invoiceNumber: string;

  @Expose()
  @Transform(({ value }) => ISODatestringToYYYYMMDD(value))
  taxPointDate: string;

  @Expose()
  supplierGLN: string;

  @Expose()
  supplierName1: string;

  @Expose()
  supplierName2: string;

  @Expose()
  supplierAddress1: string;

  @Expose()
  supplierAddress2: string;

  @Expose()
  supplierCityName: string;

  @Expose()
  supplierPostcode: string;

  @Expose()
  supplierCountryCode: string;

  @Expose()
  supplierVATNumber: string;

  @Expose()
  invoiceeGLN: string;

  @Expose()
  invoiceeName1: string;

  @Transform(undefineIf(({ value }) => value === ''))
  @Expose()
  invoiceeName2: string;

  @Expose()
  invoiceeAddress1: string;

  @Transform(undefineIf(({ value }) => value === ''))
  @Expose()
  invoiceeAddress2: string;

  @Expose()
  invoiceeCityName: string;

  @Expose()
  invoiceePostCode: string;

  @Expose()
  invoiceeCountryCode: string;

  @Expose()
  invoiceeVATNumber: string;

  @Expose()
  currencyISOCode: string;

  @Expose()
  invoiceTotal: number;

  @Expose()
  @Type(() => InvoiceMessageLineOut)
  lineItems: InvoiceMessageLineOut[];

  @Expose()
  @Type(() => InvoiceMessageSummaryLineOut)
  VATSummaries: InvoiceMessageSummaryLineOut[];

  copyValues(invoice: Invoice): InvoiceMessageOut {
    const onePurchaseOrder = invoice.purchaseOrders[0];
    util.copyValues(this, onePurchaseOrder, ['marketplace', 'currencyISOCode']);
    const names = [
      'invoiceNumber',
      'taxPointDate',
      'invoiceeGLN',
      'invoiceeName1',
      'invoiceeName2',
      'invoiceeAddress1',
      'invoiceeAddress2',
      'invoiceePostcode',
      'invoiceeCityName',
      'invoiceeCountryCode',
      'invoiceeVATNumber',
      'invoiceTotal',
    ];
    util.copyValues(this, invoice, names);
    this.lineItems = invoice.lineItems.map((il) => {
      const invoiceLineMessage = new InvoiceMessageLineOut();
      return invoiceLineMessage.copyValues(il);
    });
    this.VATSummaries = invoice.VATSummaries.map((tl) => {
      const taxSummaryLine = new InvoiceMessageSummaryLineOut();
      return taxSummaryLine.copyValues(tl);
    });
    return this;
  }
}

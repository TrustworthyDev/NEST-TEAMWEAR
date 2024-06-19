import { Type } from 'class-transformer';
import {
  Allow,
  IsDateString,
  IsNotEmpty,
  ValidateNested,
} from 'class-validator';
import { InvoiceMessageLineIn } from 'src/invoice-line/ dto/invoice-message-line-in';
import { InvoiceMessageSummaryLineIn } from 'src/tax-line/dto/invoice-message-summary-line-in';

/**
 * Must be used with transform as a ValidationPipe option
 * for conversion of the number strings to numbers.
 */
export class InvoiceMessageIn {
  @IsNotEmpty()
  invoiceNumber: string;

  @IsDateString()
  taxPointDate: string;

  @IsNotEmpty()
  invoiceeGLN: string;

  @IsNotEmpty()
  invoiceeName1: string;

  @Allow()
  invoiceeName2?: string;

  @IsNotEmpty()
  invoiceeAddress1: string;

  @Allow()
  invoiceeAddress2?: string;

  @IsNotEmpty()
  invoiceeCityName: string;

  @IsNotEmpty()
  invoiceePostcode: string;

  @IsNotEmpty()
  invoiceeCountryCode: string;

  @IsNotEmpty()
  invoiceeVATNumber: string;

  @IsNotEmpty()
  invoiceTotal: number;

  @ValidateNested()
  @Type(() => InvoiceMessageLineIn)
  lineItems: InvoiceMessageLineIn[];

  @ValidateNested()
  @Type(() => InvoiceMessageSummaryLineIn)
  VATSummaries: InvoiceMessageSummaryLineIn[];
}

import { IsNumber } from 'class-validator';

export class InvoiceMessageSummaryLineIn {
  @IsNumber()
  VATRate: number;

  @IsNumber()
  taxAmount: number;

  @IsNumber()
  taxableAmount: number;
}

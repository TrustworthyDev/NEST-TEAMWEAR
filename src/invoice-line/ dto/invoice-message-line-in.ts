import { IsNotEmpty, IsNumber } from 'class-validator';

export class InvoiceMessageLineIn {
  @IsNotEmpty()
  itemNumber: string;

  @IsNotEmpty()
  orderNumber: string;

  @IsNumber()
  invoicedQuantity: number;

  @IsNumber()
  netPrice: number;

  @IsNumber()
  totalNetPrice: number;

  @IsNumber()
  taxRate: number;
}

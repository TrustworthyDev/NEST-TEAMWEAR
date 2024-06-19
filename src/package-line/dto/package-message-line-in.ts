import { IsNotEmpty, IsNumber } from 'class-validator';

export class PackageMessageLineIn {
  @IsNotEmpty()
  orderNumber: string;

  @IsNotEmpty()
  itemNumber: string;

  @IsNumber()
  shippedQuantity: number;
}

import { IsNotEmpty, IsNumberString } from 'class-validator';

export class CreateLineItemDto {
  @IsNumberString()
  lineItemNumber: number;

  @IsNotEmpty()
  itemNumber: string;

  @IsNotEmpty()
  itemNumberType: string; //could be enum

  @IsNumberString()
  orderedQuantity: number;

  @IsNumberString()
  netPrice: number;
}

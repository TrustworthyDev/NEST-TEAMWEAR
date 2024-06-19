import { IsNotEmpty, IsNumber } from 'class-validator';

export class LineItemOrderResponseMessageIn {
  @IsNotEmpty()
  itemNumber: string;

  // implicit conversion should be activated on the ValidationPipe
  @IsNumber()
  orderedQuantity: number;

  @IsNumber()
  netPrice: number;
}

import { IsNotEmpty } from 'class-validator';

export class CreateProductDto {
  @IsNotEmpty({ always: true })
  productNumber: string;
}

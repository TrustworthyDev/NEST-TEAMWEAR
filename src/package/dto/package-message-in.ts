import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, ValidateNested } from 'class-validator';
import { PackageMessageLineIn } from 'src/package-line/dto/package-message-line-in';

export class PackageMessageIn {
  @IsNotEmpty()
  packageNumber: string;

  @IsNumber()
  weight: number;

  @IsNumber()
  width: number;

  @IsNumber()
  length: number;

  @IsNumber()
  height: number;

  @IsNotEmpty()
  SSCC: string;

  @ValidateNested()
  @Type(() => PackageMessageLineIn)
  lineItems: PackageMessageLineIn[];
}

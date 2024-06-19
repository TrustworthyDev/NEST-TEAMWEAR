import { Type } from 'class-transformer';
import { Allow, IsNotEmpty, ValidateNested } from 'class-validator';
import { PackageMessageIn } from 'src/package/dto/package-message-in';

export class PackingListMessageIn {
  @IsNotEmpty()
  documentNumber: string;

  @IsNotEmpty()
  shipToName: string;

  @IsNotEmpty()
  shipToGLN: string;

  @IsNotEmpty()
  shipToAddressLine1: string;

  @Allow()
  shipToAddressLine2?: string;

  @IsNotEmpty()
  shipToCity: string;

  @IsNotEmpty()
  shipToCountryCode: string;

  @IsNotEmpty()
  shipToPostalCode: string;

  @ValidateNested()
  @Type(() => PackageMessageIn)
  packages: PackageMessageIn[];
}

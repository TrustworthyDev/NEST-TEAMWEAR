import { Allow, IsEnum, IsNotEmpty, ValidateNested } from 'class-validator';
import { Courier } from '../enum/courier.enum';
import { ObjectWithIdDto } from 'src/common/dto/object-with-id.dto';
import { Type } from 'class-transformer';
import { CreateCustomsDocumentDto } from 'src/customs-document/dto/create-customs-document.dto';

export class CreateShipmentDto {
  @IsEnum(Courier)
  courier: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => ObjectWithIdDto)
  packingLists: Array<ObjectWithIdDto>;

  @Allow()
  @ValidateNested()
  @Type(() => CreateCustomsDocumentDto)
  customsDocuments: Array<CreateCustomsDocumentDto>;
}

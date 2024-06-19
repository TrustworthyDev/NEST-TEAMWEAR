import { IsString } from 'class-validator';

export class CreateCustomsDocumentDto {
  @IsString()
  content: string;

  @IsString()
  name: string;

  @IsString()
  fileType: string;
}

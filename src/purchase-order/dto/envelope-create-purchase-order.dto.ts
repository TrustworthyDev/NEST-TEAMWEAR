import { Type } from 'class-transformer';
import { JSONEnvelopeDto, JSONRootDto } from 'src/common/dto/json-envelope.dto';
import { CreatePurchaseOrderDto } from './create-purchase-order.dto';

class RootCreatePurchaseOrderDto extends JSONRootDto<CreatePurchaseOrderDto> {
  @Type(() => CreatePurchaseOrderDto)
  MESSAGES: CreatePurchaseOrderDto[];
}

export class EnvelopeCreatePurchaseOrderDto extends JSONEnvelopeDto<CreatePurchaseOrderDto> {
  @Type(() => RootCreatePurchaseOrderDto)
  ROOT: RootCreatePurchaseOrderDto;
}

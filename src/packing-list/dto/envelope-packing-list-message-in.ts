import { Type } from 'class-transformer';
import { JSONEnvelopeDto, JSONRootDto } from 'src/common/dto/json-envelope.dto';
import { PackingListMessageIn } from './packing-list-message-in';

class RootPackingListMessageIn extends JSONRootDto<PackingListMessageIn> {
  @Type(() => PackingListMessageIn)
  MESSAGES: PackingListMessageIn[];
}

export class EnvelopePackingListMessageIn extends JSONEnvelopeDto<PackingListMessageIn> {
  @Type(() => RootPackingListMessageIn)
  ROOT: RootPackingListMessageIn;
}

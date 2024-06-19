import { Type } from 'class-transformer';
import { JSONEnvelopeDto, JSONRootDto } from 'src/common/dto/json-envelope.dto';
import { OrderMessageOut } from './order-message-out';

class RootOrderMessageOut extends JSONRootDto<OrderMessageOut> {
  @Type(() => OrderMessageOut)
  MESSAGES: OrderMessageOut[];
}

export class EnvelopeOrderMessageOut extends JSONEnvelopeDto<OrderMessageOut> {
  @Type(() => RootOrderMessageOut)
  ROOT: RootOrderMessageOut;

  constructor() {
    super();
    this.ROOT = new RootOrderMessageOut();
  }
}

import { Type } from 'class-transformer';
import { JSONEnvelopeDto, JSONRootDto } from 'src/common/dto/json-envelope.dto';
import { OrderResponseMessageIn } from './order-response-message-in';

class RootOrderResponseMessageIn extends JSONRootDto<OrderResponseMessageIn> {
  @Type(() => OrderResponseMessageIn)
  MESSAGES: OrderResponseMessageIn[];
}

export class EnvelopeOrderResponseMessageIn extends JSONEnvelopeDto<OrderResponseMessageIn> {
  @Type(() => RootOrderResponseMessageIn)
  ROOT: RootOrderResponseMessageIn;
}

import { Type } from 'class-transformer';
import { AMAZON_GLN } from 'src/common/constants';
import { JSONEnvelopeDto, JSONRootDto } from 'src/common/dto/json-envelope.dto';
import { OrderAcknowledgementMessageOut } from './order-acknowledgement-message-out';

class RootOrderAcknowledgementMessageOut extends JSONRootDto<OrderAcknowledgementMessageOut> {
  @Type(() => OrderAcknowledgementMessageOut)
  MESSAGES: OrderAcknowledgementMessageOut[];
}

export class EnvelopeOrderAcknowledgementMessageOut extends JSONEnvelopeDto<OrderAcknowledgementMessageOut> {
  @Type(() => RootOrderAcknowledgementMessageOut)
  ROOT: RootOrderAcknowledgementMessageOut;

  constructor() {
    super();
    this.ROOT = new RootOrderAcknowledgementMessageOut();
  }

  public override wrap(
    message: OrderAcknowledgementMessageOut,
  ): EnvelopeOrderAcknowledgementMessageOut {
    super.wrap(message);
    this.ROOT.HEADERS = [
      {
        interchangeRecipientName: AMAZON_GLN,
        interchangeSenderName: message.supplierGLN,
      },
    ];
    return this;
  }
}

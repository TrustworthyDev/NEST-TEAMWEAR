import { Type } from 'class-transformer';
import { AMAZON_GLN } from 'src/common/constants';
import { JSONEnvelopeDto, JSONRootDto } from 'src/common/dto/json-envelope.dto';
import { InvoiceMessageOut } from './invoice-message-out';

class RootInvoiceMessageOut extends JSONRootDto<InvoiceMessageOut> {
  @Type(() => InvoiceMessageOut)
  MESSAGES: InvoiceMessageOut[];
}

export class EnvelopeInvoiceMessageOut extends JSONEnvelopeDto<InvoiceMessageOut> {
  @Type(() => RootInvoiceMessageOut)
  ROOT: RootInvoiceMessageOut;

  constructor() {
    super();
    this.ROOT = new RootInvoiceMessageOut();
  }

  public override wrap(message: InvoiceMessageOut): EnvelopeInvoiceMessageOut {
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

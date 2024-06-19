import { Type } from 'class-transformer';
import { JSONEnvelopeDto, JSONRootDto } from 'src/common/dto/json-envelope.dto';
import { InvoiceMessageIn } from './invoice-message-in';

class RootInvoiceMessageIn extends JSONRootDto<InvoiceMessageIn> {
  @Type(() => InvoiceMessageIn)
  MESSAGES: InvoiceMessageIn[];
}

export class EnvelopeInvoiceMessageIn extends JSONEnvelopeDto<InvoiceMessageIn> {
  @Type(() => RootInvoiceMessageIn)
  ROOT: RootInvoiceMessageIn;
}

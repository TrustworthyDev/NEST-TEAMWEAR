import { JSONEnvelopeDto, JSONRootDto } from 'src/common/dto/json-envelope.dto';
import { ShipmentNoticeMessageOut } from './shipment-notice-message-out';
import { Type } from 'class-transformer';
import { AMAZON_GLN } from 'src/common/constants';

class RootShipmentNoticeMessageOut extends JSONRootDto<ShipmentNoticeMessageOut> {
  @Type(() => ShipmentNoticeMessageOut)
  MESSAGES: ShipmentNoticeMessageOut[];
}

export class EnvelopeShipmentNoticeMessageOut extends JSONEnvelopeDto<ShipmentNoticeMessageOut> {
  @Type(() => RootShipmentNoticeMessageOut)
  ROOT: RootShipmentNoticeMessageOut;

  constructor() {
    super();
    this.ROOT = new RootShipmentNoticeMessageOut();
  }

  public override wrap(
    message: ShipmentNoticeMessageOut,
  ): EnvelopeShipmentNoticeMessageOut {
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

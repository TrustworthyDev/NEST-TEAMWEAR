import { Type } from 'class-transformer';
import { IsNotEmpty, ValidateNested } from 'class-validator';

export class JSONHeaderDto {
  interchangeSenderName?: string;
  interchangeRecipientName?: string;
  uniqueMessageReference?: string;
  messageTypeIdentifier?: string;
  messageTypeVersionNumber?: string;
  messageTypeControllingAgency?: string;
  associationAssignedCode?: string;
  numberOfMessageSegments?: number;
}

export abstract class JSONRootDto<T> {
  @ValidateNested()
  @Type(() => JSONHeaderDto)
  HEADERS: JSONHeaderDto[];

  @IsNotEmpty()
  @ValidateNested()
  abstract MESSAGES: T[];
}

export abstract class JSONEnvelopeDto<MessageType> {
  @IsNotEmpty()
  @ValidateNested()
  abstract ROOT: JSONRootDto<MessageType>;

  public wrap(message: MessageType): JSONEnvelopeDto<MessageType> {
    this.ROOT.MESSAGES = [message];
    return this;
  }
}

export function extractMessage<T>(envelope: JSONEnvelopeDto<T>): T {
  return envelope.ROOT.MESSAGES[0];
}

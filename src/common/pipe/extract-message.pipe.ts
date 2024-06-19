import { ArgumentMetadata, PipeTransform } from '@nestjs/common';
import { extractMessage, JSONEnvelopeDto } from '../dto/json-envelope.dto';

/**
 * A FAILED attempt at a pipe to extract a message from an envelope.
 * The reason it failed is it relies on the envelope being typed as
 * a JSONEnvelopeDto, which is consistent with ValidationPipe and thus
 * should not be changed, but then transforms it into a different type.
 * This would make transformed objects look like an envelope type when they
 * are actually of message type. Pipes should probably not be used to change
 * the type of route parameters from the type used in route definitions.
 */
export class ExtractMessagePipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.metatype instanceof JSONEnvelopeDto) {
      const typedValue = value as JSONEnvelopeDto<any>;
      return extractMessage(typedValue);
    }
    return value;
  }
}

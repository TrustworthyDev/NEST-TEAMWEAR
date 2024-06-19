import {
  Body,
  Controller,
  HttpCode,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { PackingListLifecycleService } from './packing-list-lifecycle.service';
import { extractMessage } from 'src/common/dto/json-envelope.dto';
import { EnvelopePackingListMessageIn } from './dto/envelope-packing-list-message-in';

@Controller('packing-list')
export class PackingListLifecycleController {
  constructor(public readonly service: PackingListLifecycleService) {}

  @UsePipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )
  @HttpCode(200)
  @Post('/from-message')
  async handlePackingListMessage(
    @Body() envelope: EnvelopePackingListMessageIn,
  ) {
    return this.service.handlePackingListMessage(extractMessage(envelope));
  }
}

import {
  Body,
  Controller,
  HttpCode,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { extractMessage } from 'src/common/dto/json-envelope.dto';
import { EnvelopeInvoiceMessageIn } from './dto/envelope-invoice-message-in';
import { InvoiceLifecycleService } from './invoice-lifecycle.service';

@Controller('invoice')
export class InvoiceLifecycleController {
  constructor(public readonly service: InvoiceLifecycleService) {}

  @UsePipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )
  @HttpCode(200)
  @Post('/from-message')
  async handleInvoiceMessage(@Body() envelope: EnvelopeInvoiceMessageIn) {
    return this.service.handleInvoiceMessage(extractMessage(envelope));
  }
}

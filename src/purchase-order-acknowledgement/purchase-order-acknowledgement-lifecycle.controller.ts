import {
  Body,
  Controller,
  HttpCode,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { extractMessage } from 'src/common/dto/json-envelope.dto';
import { EnvelopeOrderResponseMessageIn } from './dto/envelope-order-response-message-in';
import { PurchaseOrderAcknowledgementLifecycleService } from './purchase-order-acknowledgement-lifecycle.service';

@Controller('purchase-order-acknowledgement')
export class PurchaseOrderAcknowledgementLifecycleController {
  constructor(
    public readonly service: PurchaseOrderAcknowledgementLifecycleService,
  ) {}

  @UsePipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )
  @HttpCode(200)
  @Post('/from-message')
  async handleResponseMessage(
    @Body() envelope: EnvelopeOrderResponseMessageIn,
  ) {
    return this.service.handleResponseMessage(extractMessage(envelope));
  }
}

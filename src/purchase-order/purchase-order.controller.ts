import {
  Body,
  Controller,
  HttpCode,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { PurchaseOrderService } from './purchase-order.service';
import { Crud, CrudController } from '@nestjsx/crud';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { EnvelopeCreatePurchaseOrderDto } from './dto/envelope-create-purchase-order.dto';
import { extractMessage } from 'src/common/dto/json-envelope.dto';
import { makeEmptyCrudRequest } from 'src/common/util/crud-request-util';

@Crud({
  model: {
    type: PurchaseOrder,
  },
  dto: {
    create: CreatePurchaseOrderDto,
  },
})
@Controller('purchase-order')
export class PurchaseOrderController implements CrudController<PurchaseOrder> {
  constructor(public readonly service: PurchaseOrderService) {}

  @UsePipes(ValidationPipe)
  @HttpCode(200)
  @Post('/from-message')
  async createOneFromMessage(@Body() envelope: EnvelopeCreatePurchaseOrderDto) {
    return this.service.createOne(
      makeEmptyCrudRequest(),
      extractMessage(envelope),
    );
  }
}

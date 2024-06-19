import { Controller, UsePipes } from '@nestjs/common';
import { ShipmentService } from './shipment.service';
import { Crud, CrudController } from '@nestjsx/crud';
import { Shipment } from './entities/shipment.entity';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { ShipmentCreateValidationPipe } from './pipes/shipment-create-validation.pipe';

@Crud({
  model: {
    type: Shipment,
  },
  dto: { create: CreateShipmentDto },
  validation: {
    whitelist: true,
  },
  routes: {
    createOneBase: {
      decorators: [UsePipes(ShipmentCreateValidationPipe)],
    },
  },
})
@Controller('shipment')
export class ShipmentController implements CrudController<Shipment> {
  constructor(public readonly service: ShipmentService) {}
}

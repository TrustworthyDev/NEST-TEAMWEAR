import { Controller, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ShipmentLifecycleService } from './shipment-lifecycle.service';

@Controller('shipment')
export class ShipmentLifecycleController {
  constructor(
    public readonly shipmentLifecycleService: ShipmentLifecycleService,
  ) {}

  @Post('/:id/void')
  async voidShipment(@Param('id', ParseIntPipe) id: number) {
    return this.shipmentLifecycleService.voidShipment(id);
  }

  @Post('/:id/asn')
  async sendShipmentNotice(@Param('id', ParseIntPipe) id: number) {
    return this.shipmentLifecycleService.onSendShipmentNotice(id);
  }
}

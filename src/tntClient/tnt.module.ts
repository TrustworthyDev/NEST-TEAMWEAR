import { Module } from '@nestjs/common';
import { TntService } from './tnt.service';
import { TntController } from './tnt.controller';
import { ShipmentModule } from 'src/shipment/shipment.module';

@Module({
  imports: [ShipmentModule],
  controllers: [TntController],
  providers: [TntService],
})
export class TntModule {}

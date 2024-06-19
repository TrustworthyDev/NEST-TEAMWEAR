import { Module } from '@nestjs/common';
import { ShipmentService } from './shipment.service';
import { ShipmentController } from './shipment.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Shipment } from './entities/shipment.entity';
import { ShipmentLifecycleService } from './shipment-lifecycle.service';
import { ShippingClientModule } from 'src/shipping-client/shipping-client-module';
import { PackingListModule } from 'src/packing-list/packing-list.module';
import { ShipmentCreateValidationPipe } from './pipes/shipment-create-validation.pipe';
import { ShipmentLifecycleController } from './shipment-lifecycle.controller';
import { FileOutputModule } from 'src/file-output/file-output.module';
import { ConfigModule } from '@nestjs/config';
import { ShipmentPackageModule } from 'src/shipment-package/shipment-package.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Shipment]),
    ShippingClientModule,
    PackingListModule,
    FileOutputModule,
    ConfigModule,
    ShipmentPackageModule,
  ],
  controllers: [ShipmentController, ShipmentLifecycleController],
  providers: [
    ShipmentService,
    ShipmentLifecycleService,
    ShipmentCreateValidationPipe,
  ],
  exports: [ShipmentService],
})
export class ShipmentModule {}

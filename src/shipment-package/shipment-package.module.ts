import { Module } from '@nestjs/common';
import { ShipmentPackageService } from './shipment-package.service';
import { ShipmentPackageController } from './shipment-package.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShipmentPackage } from './entities/shipment-package.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ShipmentPackage])],
  controllers: [ShipmentPackageController],
  providers: [ShipmentPackageService],
  exports: [ShipmentPackageService],
})
export class ShipmentPackageModule {}

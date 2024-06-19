import { Injectable } from '@nestjs/common';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';
import { ShipmentPackage } from './entities/shipment-package.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class ShipmentPackageService extends TypeOrmCrudService<ShipmentPackage> {
  constructor(
    @InjectRepository(ShipmentPackage) repo: Repository<ShipmentPackage>,
  ) {
    super(repo);
  }
}

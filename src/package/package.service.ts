import { Injectable } from '@nestjs/common';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';
import { Package } from './entities/package.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class PackageService extends TypeOrmCrudService<Package> {
  constructor(@InjectRepository(Package) readonly repo: Repository<Package>) {
    super(repo);
  }
}

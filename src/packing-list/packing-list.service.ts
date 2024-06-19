import { Injectable } from '@nestjs/common';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';
import { PackingList } from './entities/packing-list.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class PackingListService extends TypeOrmCrudService<PackingList> {
  constructor(@InjectRepository(PackingList) repo: Repository<PackingList>) {
    super(repo);
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';
import { Repository } from 'typeorm';
import { OrderItemsMexal } from './entities/order-items-mexal.entity';

@Injectable()
export class OrderItemsMexalService extends TypeOrmCrudService<OrderItemsMexal> {
  constructor(
    @InjectRepository(OrderItemsMexal) repo: Repository<OrderItemsMexal>,
  ) {
    super(repo);
  }

  public async deleteMany(entities: OrderItemsMexal[]) {
    return this.repo.remove(entities);
  }
}

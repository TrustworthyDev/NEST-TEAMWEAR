import { Injectable } from '@nestjs/common';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';
import { Shipment } from './entities/shipment.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { CrudRequest } from '@nestjsx/crud';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AppEvents } from 'src/common/event/app-events';

@Injectable()
export class ShipmentService extends TypeOrmCrudService<Shipment> {
  constructor(
    @InjectRepository(Shipment) repo: Repository<Shipment>,
    private readonly eventEmitter: EventEmitter2,
  ) {
    super(repo);
  }

  public override async createOne(
    req: CrudRequest,
    dto: DeepPartial<Shipment>,
  ): Promise<Shipment> {
    const res = await super.createOne(req, dto);
    this.eventEmitter.emit(AppEvents.SHIPMENT_CREATE, res.id);
    return res;
  }
}

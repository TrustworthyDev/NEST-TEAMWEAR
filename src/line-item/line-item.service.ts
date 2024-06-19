import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';
import { Repository } from 'typeorm';
import { LineItem } from './entities/line-item.entity';
import { makeEntityCrudRequest } from 'src/common/util/crud-request-util';

@Injectable()
export class LineItemService extends TypeOrmCrudService<LineItem> {
  constructor(@InjectRepository(LineItem) repo: Repository<LineItem>) {
    super(repo);
  }

  public async getLineItemByOrderNumberAndItemNumber(
    orderNumber: string,
    itemNumber: string,
  ) {
    const queryRequest = makeEntityCrudRequest<LineItem>();
    queryRequest.options.query.join = {
      purchaseOrder: { eager: true },
    };
    queryRequest.parsed.search = {
      itemNumber: { $eq: itemNumber },
      'purchaseOrder.orderNumber': { $eq: orderNumber },
    };

    return this.getOne(queryRequest);
  }
}

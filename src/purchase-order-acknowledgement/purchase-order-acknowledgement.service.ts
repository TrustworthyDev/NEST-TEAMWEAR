import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';
import { Repository } from 'typeorm';
import { PurchaseOrderAcknowledgement } from './entities/purchase-order-acknowledgement.entity';
import { makeEntityCrudRequest } from 'src/common/util/crud-request-util';

@Injectable()
export class PurchaseOrderAcknowledgementService extends TypeOrmCrudService<PurchaseOrderAcknowledgement> {
  constructor(
    @InjectRepository(PurchaseOrderAcknowledgement)
    repo: Repository<PurchaseOrderAcknowledgement>,
  ) {
    super(repo);
  }

  async getFullPurchaseOrderAcknowledgement(
    orderNumber: string,
  ): Promise<PurchaseOrderAcknowledgement> {
    const query = makeEntityCrudRequest<PurchaseOrderAcknowledgement>();
    query.options.query.join = {
      purchaseOrder: { eager: true },
      lineItemAcknowledgements: { eager: true },
      'lineItemAcknowledgements.lineItem': { eager: true },
    };
    query.parsed.search = {
      'purchaseOrder.orderNumber': { $eq: orderNumber },
    };

    let result: PurchaseOrderAcknowledgement;

    try {
      result = await this.getOne(query);
    } catch (e) {
      throw new NotFoundException(
        'Not found',
        `POA for orderNumber ${orderNumber} not found`,
      );
    }

    return result;
  }
}

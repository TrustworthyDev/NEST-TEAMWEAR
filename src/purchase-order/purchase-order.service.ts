import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CrudRequest } from '@nestjsx/crud';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';
import {
  makeEmptyCrudRequest,
  makeEntityCrudRequest,
} from 'src/common/util/crud-request-util';
import { FileOutputService } from 'src/file-output/file-output.service';
import { ProductService } from 'src/product/product.service';
import { DeepPartial, Repository } from 'typeorm';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AppEvents } from 'src/common/event/app-events';
import { QueryFailedError } from 'typeorm';
import { ProductStatusType } from 'src/product/enum/product-status-type.enum';

@Injectable()
export class PurchaseOrderService extends TypeOrmCrudService<PurchaseOrder> {
  constructor(
    @InjectRepository(PurchaseOrder) repo: Repository<PurchaseOrder>,
    private readonly productService: ProductService,
    private readonly fileOutputService: FileOutputService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    super(repo);
  }

  private readonly logger = new Logger(PurchaseOrderService.name);

  public override async createOne(
    req: CrudRequest,
    dto: DeepPartial<PurchaseOrder>,
  ): Promise<PurchaseOrder> {
    req = makeEmptyCrudRequest();
    const entity = this.prepareEntityBeforeSave(dto, req.parsed);

    /* istanbul ignore if */
    if (!entity) {
      this.throwBadRequestException(`Empty data. Nothing to save.`);
    }

    for (const lineItem of entity.lineItems) {
      const product = await this.productService.findOne({
        where: { productNumber: lineItem.itemNumber },
      });
      if (product) {
        lineItem.productStatus = ProductStatusType.OBSOLETE;
      } else {
        lineItem.productStatus = ProductStatusType.CURRENT;
      }
    }

    let saved;
    try {
      saved = await this.repo.save(entity);
    } catch (e) {
      if (e instanceof QueryFailedError) {
        if (e.driverError.code === 'ER_DUP_ENTRY') {
          this.logger.verbose(`Deduped order ${entity.orderNumber}`);
          return;
        }
      }
      throw e;
    }

    this.eventEmitter.emit(
      AppEvents.ORDER_CREATE,
      saved.orderNumber,
      saved.amazonVendorCode,
    );
    return saved;
  }

  public async getPurchaseOrdersByOrderNumbers(orderNumbers: Set<string>) {
    const purchaseOrderPromises: Array<Promise<PurchaseOrder>> = [];
    for (const orderNumber of orderNumbers) {
      const queryRequest = makeEntityCrudRequest<PurchaseOrder>();
      queryRequest.parsed.search = { orderNumber: { $eq: orderNumber } };
      purchaseOrderPromises.push(
        this.getOne(queryRequest).catch((err) => {
          err.orderNumber = orderNumber;
          throw err;
        }),
      );
    }
    let purchaseOrders: PurchaseOrder[];
    try {
      purchaseOrders = await Promise.all(purchaseOrderPromises);
    } catch (e) {
      throw new NotFoundException(
        'Not Found',
        `Purchase Order number ${e.orderNumber} not found`,
      );
    }
    return purchaseOrders;
  }
}

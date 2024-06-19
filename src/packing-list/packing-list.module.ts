import { Module } from '@nestjs/common';
import { PackingListService } from './packing-list.service';
import { PackingListController } from './packing-list.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PackingList } from './entities/packing-list.entity';
import { PackingListLifecycleService } from './packing-list-lifecycle.service';
import { PackingListLifecycleController } from './packing-list-lifecycle.controller';
import { PurchaseOrderModule } from 'src/purchase-order/purchase-order.module';
import { LineItemModule } from 'src/line-item/line-item.module';
import { PurchaseOrderAcknowledgementModule } from 'src/purchase-order-acknowledgement/purchase-order-acknowledgement.module';
import { PackageLineModule } from 'src/package-line/package-line.module';
import { PackageModule } from 'src/package/package.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PackingList]),
    PurchaseOrderModule,
    LineItemModule,
    PurchaseOrderAcknowledgementModule,
    PackageModule,
    PackageLineModule,
  ],
  controllers: [PackingListController, PackingListLifecycleController],
  providers: [PackingListService, PackingListLifecycleService],
  exports: [PackingListService],
})
export class PackingListModule {}

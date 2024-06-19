import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileOutputModule } from 'src/file-output/file-output.module';
import { PurchaseOrderAcknowledgementModule } from 'src/purchase-order-acknowledgement/purchase-order-acknowledgement.module';
import { PurchaseOrderModule } from 'src/purchase-order/purchase-order.module';
import { OrderItemsMexal } from './entities/order-items-mexal.entity';
import { OrderItemsMexalLifecycleService } from './order-items-mexal-lifecycle.service';
import { OrderItemsMexalService } from './order-items-mexal.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrderItemsMexal]),
    PurchaseOrderModule,
    FileOutputModule,
    PurchaseOrderAcknowledgementModule,
  ],
  providers: [OrderItemsMexalService, OrderItemsMexalLifecycleService],
  exports: [OrderItemsMexalService],
})
export class OrderItemsMexalModule {}

import { Module } from '@nestjs/common';
import { PurchaseOrderService } from './purchase-order.service';
import { PurchaseOrderController } from './purchase-order.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { ProductModule } from 'src/product/product.module';
import { FileOutputModule } from 'src/file-output/file-output.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PurchaseOrder]),
    ProductModule,
    FileOutputModule,
  ],
  controllers: [PurchaseOrderController],
  providers: [PurchaseOrderService],
  exports: [PurchaseOrderService],
})
export class PurchaseOrderModule {}

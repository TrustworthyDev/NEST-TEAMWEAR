import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileOutputModule } from 'src/file-output/file-output.module';
import { LineItemModule } from 'src/line-item/line-item.module';
import { PurchaseOrderModule } from 'src/purchase-order/purchase-order.module';
import { Invoice } from './entities/invoice.entity';
import { InvoiceLifecycleController } from './invoice-lifecycle.controller';
import { InvoiceLifecycleService } from './invoice-lifecycle.service';
import { InvoiceService } from './invoice.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invoice]),
    FileOutputModule,
    PurchaseOrderModule,
    LineItemModule,
    ConfigModule,
  ],
  controllers: [InvoiceLifecycleController],
  providers: [InvoiceService, InvoiceLifecycleService],
  exports: [InvoiceService],
})
export class InvoiceModule {}

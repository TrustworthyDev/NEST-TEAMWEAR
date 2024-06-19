import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PurchaseOrderModule } from './purchase-order/purchase-order.module';
import { LineItemModule } from './line-item/line-item.module';
import { DatabaseModule } from './database.module';
import { ProductModule } from './product/product.module';
import { PurchaseOrderAcknowledgementModule } from './purchase-order-acknowledgement/purchase-order-acknowledgement.module';
import { ConfigModule } from '@nestjs/config';
import { FileOutputModule } from './file-output/file-output.module';
import { OrderItemsMexalModule } from './order-items-mexal/order-items-mexal.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { LineItemAcknowledgementModule } from './line-item-acknowledgement/line-item-acknowledgement.module';
import { InvoiceModule } from './invoice/invoice.module';
import { environmentValidationSchema } from './config/config-keys.enum';
import { PackingListModule } from './packing-list/packing-list.module';
import { ShipmentModule } from './shipment/shipment.module';
import { ShipmentPackageModule } from './shipment-package/shipment-package.module';
import { PackageModule } from './package/package.module';
import { CustomsDocumentModule } from './customs-document/customs-document.module';
import { TntModule } from './tntClient/tnt.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      validationSchema: environmentValidationSchema,
    }),
    EventEmitterModule.forRoot(),
    DatabaseModule,
    PurchaseOrderModule,
    LineItemModule,
    ProductModule,
    PurchaseOrderAcknowledgementModule,
    FileOutputModule,
    OrderItemsMexalModule,
    LineItemAcknowledgementModule,
    InvoiceModule,
    PackingListModule,
    ShipmentModule,
    ShipmentPackageModule,
    PackageModule,
    CustomsDocumentModule,
    TntModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

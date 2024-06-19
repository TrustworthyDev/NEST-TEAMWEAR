import { Module } from '@nestjs/common';
import { PurchaseOrderAcknowledgementService } from './purchase-order-acknowledgement.service';
import { PurchaseOrderAcknowledgementController } from './purchase-order-acknowledgement.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchaseOrderAcknowledgement } from './entities/purchase-order-acknowledgement.entity';
import { PurchaseOrderAcknowledgementLifecycleController } from './purchase-order-acknowledgement-lifecycle.controller';
import { PurchaseOrderAcknowledgementLifecycleService } from './purchase-order-acknowledgement-lifecycle.service';
import { FileOutputModule } from 'src/file-output/file-output.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PurchaseOrderAcknowledgement]),
    FileOutputModule,
  ],
  controllers: [
    PurchaseOrderAcknowledgementController,
    PurchaseOrderAcknowledgementLifecycleController,
  ],
  providers: [
    PurchaseOrderAcknowledgementService,
    PurchaseOrderAcknowledgementLifecycleService,
  ],
  exports: [PurchaseOrderAcknowledgementService],
})
export class PurchaseOrderAcknowledgementModule {}

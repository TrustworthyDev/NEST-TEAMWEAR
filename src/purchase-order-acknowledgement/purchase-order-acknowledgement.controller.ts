import { Controller } from '@nestjs/common';
import { Crud, CrudController } from '@nestjsx/crud';
import { PurchaseOrderAcknowledgement } from './entities/purchase-order-acknowledgement.entity';
import { PurchaseOrderAcknowledgementService } from './purchase-order-acknowledgement.service';

@Crud({
  model: { type: PurchaseOrderAcknowledgement },
})
@Controller('purchase-order-acknowledgement')
export class PurchaseOrderAcknowledgementController
  implements CrudController<PurchaseOrderAcknowledgement>
{
  constructor(public readonly service: PurchaseOrderAcknowledgementService) {}
}

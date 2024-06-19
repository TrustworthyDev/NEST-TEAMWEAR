import { Controller } from '@nestjs/common';
import { ShipmentPackageService } from './shipment-package.service';
import { Crud, CrudController } from '@nestjsx/crud';
import { ShipmentPackage } from './entities/shipment-package.entity';

@Crud({
  model: {
    type: ShipmentPackage,
  },
})
@Controller('shipment-package')
export class ShipmentPackageController
  implements CrudController<ShipmentPackage>
{
  constructor(public readonly service: ShipmentPackageService) {}
}

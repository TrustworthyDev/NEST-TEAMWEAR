import { Controller } from '@nestjs/common';
import { PackageService } from './package.service';
import { Crud, CrudController } from '@nestjsx/crud';
import { Package } from './entities/package.entity';

@Crud({
  model: { type: Package },
})
@Controller('package')
export class PackageController implements CrudController<Package> {
  constructor(public readonly service: PackageService) {}
}

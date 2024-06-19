import { Controller } from '@nestjs/common';
import { PackingListService } from './packing-list.service';
import { Crud, CrudController } from '@nestjsx/crud';
import { PackingList } from './entities/packing-list.entity';

@Crud({
  model: {
    type: PackingList,
  },
})
@Controller('packing-list')
export class PackingListController implements CrudController<PackingList> {
  constructor(public readonly service: PackingListService) {}
}

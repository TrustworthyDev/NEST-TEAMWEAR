import { Controller } from '@nestjs/common';
import { LineItemService } from './line-item.service';
import { Crud, CrudController } from '@nestjsx/crud';
import { LineItem } from './entities/line-item.entity';
import { CreateLineItemDto } from './dto/create-line-item.dto';

@Crud({
  model: {
    type: LineItem,
  },
  dto: {
    create: CreateLineItemDto,
  },
})
@Controller('line-item')
export class LineItemController implements CrudController<LineItem> {
  constructor(public readonly service: LineItemService) {}
}

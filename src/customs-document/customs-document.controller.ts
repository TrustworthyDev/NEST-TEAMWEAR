import { Controller } from '@nestjs/common';
import { CustomsDocumentService } from './customs-document.service';
import { Crud, CrudController } from '@nestjsx/crud';
import { CustomsDocument } from './entities/customs-document.entity';

@Crud({
  model: {type: CustomsDocument},
  routes: {
    only: ['getOneBase', 'getManyBase']
  },
  query: {
    exclude: ["content"]
  }
})
@Controller('customs-document')
export class CustomsDocumentController implements CrudController<CustomsDocument> {
  constructor(public readonly service: CustomsDocumentService) {}
}

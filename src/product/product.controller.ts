import { Controller } from '@nestjs/common';
import { Crud, CrudController } from '@nestjsx/crud';
import { CreateProductDto } from './dto/create-product.dto';
import { Product } from './entities/product.entity';
import { ProductService } from './product.service';

@Crud({
  model: {
    type: Product,
  },
  dto: {
    create: CreateProductDto,
  },
})
@Controller('product')
export class ProductController implements CrudController<Product> {
  constructor(public readonly service: ProductService) {}
}

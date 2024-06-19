import { Module } from '@nestjs/common';
import { LineItemService } from './line-item.service';
import { LineItemController } from './line-item.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LineItem } from './entities/line-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LineItem])],
  controllers: [LineItemController],
  providers: [LineItemService],
  exports: [LineItemService],
})
export class LineItemModule {}

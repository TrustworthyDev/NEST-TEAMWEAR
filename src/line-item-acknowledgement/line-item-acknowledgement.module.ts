import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LineItemAcknowledgement } from './entities/line-item-acknowledgement.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LineItemAcknowledgement])],
})
export class LineItemAcknowledgementModule {}

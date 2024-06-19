import { Module } from '@nestjs/common';
import { CustomsDocumentService } from './customs-document.service';
import { CustomsDocumentController } from './customs-document.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomsDocument } from './entities/customs-document.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CustomsDocument])],
  controllers: [CustomsDocumentController],
  providers: [CustomsDocumentService]
})
export class CustomsDocumentModule {}

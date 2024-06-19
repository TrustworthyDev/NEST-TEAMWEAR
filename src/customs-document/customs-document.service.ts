import { Injectable } from '@nestjs/common';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';
import { CustomsDocument } from './entities/customs-document.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class CustomsDocumentService extends TypeOrmCrudService<CustomsDocument> {
  constructor(
    @InjectRepository(CustomsDocument)
    repo: Repository<CustomsDocument>,
  ) {
    super(repo)
  }
}

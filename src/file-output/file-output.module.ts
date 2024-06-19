import { Module } from '@nestjs/common';
import { FileOutputService } from './file-output.service';

@Module({
  providers: [FileOutputService],
  exports: [FileOutputService],
})
export class FileOutputModule {}

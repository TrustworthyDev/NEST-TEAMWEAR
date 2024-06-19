import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PackageLine } from './entities/package-line.entity';
import { PackageLineService } from './package-line.service';

@Module({
  imports: [TypeOrmModule.forFeature([PackageLine])],
  providers: [PackageLineService],
  exports: [PackageLineService],
})
export class PackageLineModule {}

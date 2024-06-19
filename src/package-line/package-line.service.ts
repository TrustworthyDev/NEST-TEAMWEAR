import { Injectable } from "@nestjs/common";
import { TypeOrmCrudService } from "@nestjsx/crud-typeorm";
import { PackageLine } from "./entities/package-line.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

@Injectable()
export class PackageLineService extends TypeOrmCrudService<PackageLine> {
  constructor(@InjectRepository(PackageLine) repo: Repository<PackageLine>) {
    super(repo)
  }
}

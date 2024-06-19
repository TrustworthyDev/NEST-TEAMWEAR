import { PackageLine } from 'src/package-line/entities/package-line.entity';
import { PackingList } from 'src/packing-list/entities/packing-list.entity';
import { ShipmentPackage } from 'src/shipment-package/entities/shipment-package.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Package {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  packageNumber: string;

  @Column()
  SSCC: string;

  @Column({ type: 'double' })
  width: number;

  @Column({ type: 'double' })
  length: number;

  @Column({ type: 'double' })
  height: number;

  @Column({ type: 'double' })
  weight: number;

  @ManyToOne(() => PackingList, (packingList) => packingList.packages)
  packingList: PackingList;

  @Column()
  packingListId: number;

  @OneToMany(() => PackageLine, (packageLine) => packageLine.package, {
    cascade: true,
  })
  packageLines: PackageLine[];

  @OneToOne(() => ShipmentPackage, (shipmentPackage) => shipmentPackage.package)
  shipmentPackage: ShipmentPackage;
}

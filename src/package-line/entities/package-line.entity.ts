import { LineItem } from 'src/line-item/entities/line-item.entity';
import { Package } from 'src/package/entities/package.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class PackageLine {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  shippedQuantity: number;

  @JoinColumn()
  @ManyToOne(() => LineItem)
  lineItem: LineItem;

  @ManyToOne(() => Package, (thePackage) => thePackage.packageLines)
  package: Package;
}

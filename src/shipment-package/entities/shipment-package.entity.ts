import { Package } from 'src/package/entities/package.entity';
import { Shipment } from 'src/shipment/entities/shipment.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class ShipmentPackage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  trackingNumber: string;

  @Column({ type: 'text' })
  label: string;

  @ManyToOne(() => Shipment, (shipment) => shipment.shipmentPackages)
  shipment: Shipment;

  @Column()
  shipmentId: number;

  @JoinColumn()
  @OneToOne(() => Package, (thePackage) => thePackage.shipmentPackage)
  package: Package;
}

import { PackingList } from 'src/packing-list/entities/packing-list.entity';
import { ShipmentPackage } from 'src/shipment-package/entities/shipment-package.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ShipmentStatusType } from '../enum/shipment-status-type.enum';
import { CustomsDocument } from 'src/customs-document/entities/customs-document.entity';

@Entity()
export class Shipment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: ShipmentStatusType,
    default: ShipmentStatusType.CREATED,
  })
  status: ShipmentStatusType;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  charge: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  chargeWithTax: number;

  @Column({ type: 'double', nullable: true })
  billingWeight: number;

  @Column({ nullable: true })
  shipmentIdentificationNumber: string;

  @Column({ nullable: true })
  shipmentTrackingNumber: string;

  @Column({ nullable: true })
  disclaimer: string;

  @Column({ nullable: true })
  error: string;

  @Column()
  courier: string;

  @Column({ nullable: true })
  date: Date;

  @Column({ nullable: true, type: 'date' })
  estimatedDeliveryDate: string;

  @OneToMany(() => PackingList, (packingList) => packingList.shipment)
  packingLists: PackingList[];

  @OneToMany(
    () => ShipmentPackage,
    (shipmentPackage) => shipmentPackage.shipment,
    { cascade: true },
  )
  shipmentPackages: ShipmentPackage[];

  @OneToMany(
    () => CustomsDocument,
    (customsDocument) => customsDocument.shipment,
    { cascade: true },
  )
  customsDocuments: CustomsDocument[];
}

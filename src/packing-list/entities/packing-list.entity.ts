import { Package } from 'src/package/entities/package.entity';
import { PurchaseOrder } from 'src/purchase-order/entities/purchase-order.entity';
import { Shipment } from 'src/shipment/entities/shipment.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PackingListStatusType } from '../enum/packing-list-status-type.enum';

@Entity()
export class PackingList {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  documentNumber: string;

  @Column({
    type: 'enum',
    enum: PackingListStatusType,
    default: PackingListStatusType.RECEIVED,
  })
  status: PackingListStatusType;

  @Column()
  previouslySent: boolean;

  @Column()
  receivedDate: Date;

  @Column()
  shipToName: string;

  @Column()
  shipToGLN: string;

  @Column()
  shipToAddressLine1: string;

  @Column({ default: '' })
  shipToAddressLine2: string;

  @Column()
  shipToCity: string;

  @Column()
  shipToCountryCode: string;

  @Column()
  shipToPostalCode: string;

  @Column({ type: 'int' })
  totalItems: number;

  @OneToMany(() => PurchaseOrder, (purchaseOrder) => purchaseOrder.packingList)
  purchaseOrders: PurchaseOrder[];

  @OneToMany(() => Package, (thePackage) => thePackage.packingList, {
    cascade: true,
  })
  packages: Package[];

  @ManyToOne(() => Shipment, (shipment) => shipment.packingLists)
  shipment: Shipment;

  @Column({ nullable: true })
  shipmentId: number;
}

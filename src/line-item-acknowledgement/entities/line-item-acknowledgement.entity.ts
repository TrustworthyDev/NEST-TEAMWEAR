import { LineItem } from 'src/line-item/entities/line-item.entity';
import { PurchaseOrderAcknowledgement } from 'src/purchase-order-acknowledgement/entities/purchase-order-acknowledgement.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { LineItemAcknowledgementStatusType } from '../enum/line-item-acknowledgement-status-type.enum';

@Entity()
export class LineItemAcknowledgement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: LineItemAcknowledgementStatusType,
    default: LineItemAcknowledgementStatusType.PARTIAL,
  })
  status: LineItemAcknowledgementStatusType;

  @Column({ default: 0 })
  quantityDispatching: number;

  @Column({ default: 0 })
  quantityBackorder: number;

  @Column({ default: 0 })
  quantityHardReject: number;

  @Column({ default: 0 })
  quantitySoftReject: number;

  @Column({ nullable: true })
  deliveryDate?: Date;

  @Column({ type: 'float', default: 0 })
  netPrice?: number;

  @Column({ type: 'float', default: 0 })
  vatRate?: number;

  @OneToOne(() => LineItem)
  @JoinColumn()
  lineItem: LineItem;

  @ManyToOne(
    () => PurchaseOrderAcknowledgement,
    (purchaseOrderAcknowledgement) =>
      purchaseOrderAcknowledgement.lineItemAcknowledgements,
  )
  purchaseOrderAcknowledgement: PurchaseOrderAcknowledgement;
}

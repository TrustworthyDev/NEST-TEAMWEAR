import { LineItemAcknowledgement } from 'src/line-item-acknowledgement/entities/line-item-acknowledgement.entity';
import { LineItemAcknowledgementStatusType } from 'src/line-item-acknowledgement/enum/line-item-acknowledgement-status-type.enum';
import { PurchaseOrder } from 'src/purchase-order/entities/purchase-order.entity';
import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PurchaseOrderAcknowledgementStatusType } from '../enum/purchase-order-acknowledgement-status-type.enum';

@Entity()
export class PurchaseOrderAcknowledgement {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => PurchaseOrder)
  @JoinColumn()
  purchaseOrder: PurchaseOrder;

  @Column({
    type: 'enum',
    enum: PurchaseOrderAcknowledgementStatusType,
    default: PurchaseOrderAcknowledgementStatusType.PARTIAL,
  })
  status: PurchaseOrderAcknowledgementStatusType;

  /**
   * Dinamically determines if the PurchaseOrderAcknowledgement is complete.
   * With the introduction of status, it shouldn't be useful anymore.
   * Requires the PurchaseOrderAcknowledgement to have
   * lineItemAcknowledgements, most likely retrieved together from database
   */
  isComplete(): boolean {
    return !this.lineItemAcknowledgements.some(
      (ack) => ack.status === LineItemAcknowledgementStatusType.PARTIAL,
    );
  }

  @OneToMany(
    () => LineItemAcknowledgement,
    (lineItemAcknowledgement) =>
      lineItemAcknowledgement.purchaseOrderAcknowledgement,
    { cascade: true },
  )
  lineItemAcknowledgements: LineItemAcknowledgement[];
}

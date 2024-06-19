import { LineItem } from 'src/line-item/entities/line-item.entity';
import { PurchaseOrder } from 'src/purchase-order/entities/purchase-order.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OrderItemsMexalStatusType } from '../enum/order-item-mexal-status-type.enum';

@Entity()
export class OrderItemsMexal {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: OrderItemsMexalStatusType,
    default: OrderItemsMexalStatusType.ACCEPTED,
  })
  status: OrderItemsMexalStatusType;

  @ManyToOne(() => PurchaseOrder)
  purchaseOrder: PurchaseOrder;

  @OneToOne(() => LineItem)
  @JoinColumn()
  lineItem: LineItem;
}

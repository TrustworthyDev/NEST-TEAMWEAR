import { InvoiceLine } from 'src/invoice-line/entities/invoice-line.entity';
import { ProductStatusType } from 'src/product/enum/product-status-type.enum';
import { PurchaseOrder } from 'src/purchase-order/entities/purchase-order.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class LineItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  lineItemNumber: number;

  @Column()
  itemNumber: string;

  @Column()
  itemNumberType: string; //could be enum

  @Column()
  orderedQuantity: number;

  @Column({ type: 'float' })
  netPrice: number;

  @ManyToOne(() => PurchaseOrder, (purchaseOrder) => purchaseOrder.lineItems)
  purchaseOrder: PurchaseOrder;

  @Column({ type: 'enum', enum: ProductStatusType })
  productStatus: ProductStatusType;

  @OneToOne(() => InvoiceLine, (invoiceLine) => invoiceLine.lineItem)
  invoiceLine?: InvoiceLine;
}

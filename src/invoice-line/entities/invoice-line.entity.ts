import { Invoice } from 'src/invoice/entities/invoice.entity';
import { LineItem } from 'src/line-item/entities/line-item.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class InvoiceLine {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  invoicedQuantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalNetPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  netPrice: number;

  @Column({ type: 'float' })
  taxRate: number;

  @ManyToOne(() => Invoice, (invoice) => invoice.lineItems)
  invoice: Invoice;

  @OneToOne(() => LineItem, (lineItem) => lineItem.invoiceLine)
  @JoinColumn()
  lineItem: LineItem;
}

import { InvoiceLine } from 'src/invoice-line/entities/invoice-line.entity';
import { PurchaseOrder } from 'src/purchase-order/entities/purchase-order.entity';
import { TaxLine } from 'src/tax-line/entities/tax-line.entity';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { InvoiceStatusType } from '../enum/invoice-status-type.enum';

@Entity()
export class Invoice {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  invoiceNumber: string;

  @Column({ type: 'date' })
  taxPointDate: string;

  @Column()
  invoiceeGLN: string;

  @Column()
  invoiceeName1: string;

  @Column({ default: '' })
  invoiceeName2: string;

  @Column()
  invoiceeAddress1: string;

  @Column({ default: '' })
  invoiceeAddress2: string;

  @Column()
  invoiceeCityName: string;

  @Column()
  invoiceePostcode: string;

  @Column()
  invoiceeCountryCode: string;

  @Column()
  invoiceeVATNumber: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  invoiceTotal: number;

  @Column({
    type: 'enum',
    enum: InvoiceStatusType,
    default: InvoiceStatusType.DRAFT,
  })
  status: InvoiceStatusType;

  @OneToMany(() => InvoiceLine, (invoiceLine) => invoiceLine.invoice, {
    cascade: true,
  })
  lineItems: InvoiceLine[];

  @OneToMany(() => TaxLine, (taxLine) => taxLine.invoice, { cascade: true })
  VATSummaries: TaxLine[];

  @ManyToMany(() => PurchaseOrder, (purchaseOrder) => purchaseOrder.invoices)
  @JoinTable()
  purchaseOrders: PurchaseOrder[];
}

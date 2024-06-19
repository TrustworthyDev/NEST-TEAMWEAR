import { Invoice } from 'src/invoice/entities/invoice.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class TaxLine {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'float' })
  VATRate: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  taxAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  taxableAmount: number;

  @ManyToOne(() => Invoice, (invoice) => invoice.VATSummaries)
  invoice: Invoice;
}

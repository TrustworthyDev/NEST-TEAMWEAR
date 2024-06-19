import { Invoice } from 'src/invoice/entities/invoice.entity';
import { LineItem } from 'src/line-item/entities/line-item.entity';
import {
  Column,
  Entity,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { FirstOrderStatus } from '../enum/purchase-order-first-order-status.enum';
import { PackingList } from 'src/packing-list/entities/packing-list.entity';

@Entity()
export class PurchaseOrder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  marketplace: string;

  @Column({ unique: true })
  orderNumber: string;

  @Column({ type: 'date' })
  dateIssued: string;

  @Column({ type: 'date' })
  deliveryDateStart: string;

  @Column({ type: 'date' })
  deliveryDateEnd: string;

  @Column({ default: FirstOrderStatus.UNKNOWN })
  firstOrderStatus?: string;

  @Column({ default: '' })
  promotionDealNumber?: string;

  @Column()
  amazonVendorCode: string;

  @Column()
  buyerGLN: string;

  @Column()
  supplierGLN: string;

  @Column()
  shipToGLN: string;

  @Column()
  shipToCountryCode: string;

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
  invoiceeCity: string;

  @Column({ default: '' })
  invoiceeState?: string;

  @Column()
  invoiceePostcode: string;

  @Column()
  invoiceeCountry: string;

  @Column()
  VATNumber: string;

  @Column()
  currencyISOCode: string;

  @Column()
  totalLineItemsControl: number;

  @OneToMany(() => LineItem, (lineItem) => lineItem.purchaseOrder, {
    cascade: true,
  })
  lineItems: LineItem[];

  @ManyToMany(() => Invoice, (invoice) => invoice.purchaseOrders)
  invoices: Invoice[];

  @ManyToOne(() => PackingList)
  packingList: PackingList;
}

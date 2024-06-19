import { Shipment } from 'src/shipment/entities/shipment.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class CustomsDocument {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'mediumtext' })
  content: string;

  @Column()
  name: string;

  @Column()
  fileType: string;

  @Column({ nullable: true })
  documentID: string;

  @ManyToOne(() => Shipment, (shipment) => shipment.customsDocuments)
  shipment: Shipment;

  @Column({ nullable: true })
  shipmentId: number;
}

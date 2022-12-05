import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DateColumns } from '../embedded/dateColumns';
import { POrder } from '../pOrder/pOrder.entity';
import { Product } from '../product/product.entity';

@Entity()
export class OrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  count: number;

  @Column()
  pOrderId: number;

  @Column()
  productId: number;

  @Column(() => DateColumns, { prefix: false })
  dateColumns: DateColumns;

  @ManyToOne(() => POrder)
  @JoinColumn({ name: 'pOrderId' })
  pOrder: POrder;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'productId' })
  product: Product;
}

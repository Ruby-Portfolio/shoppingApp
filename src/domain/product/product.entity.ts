import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DateColumns } from '../embedded/dateColumns';
import { Market } from '../market/market.entity';

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  price: number;

  @Column()
  stock: number;

  @Column()
  marketId: number;

  @Column(() => DateColumns, { prefix: false })
  dateColumns: DateColumns;

  @ManyToOne(() => Market)
  @JoinColumn({ name: 'marketId' })
  market: Market;
}

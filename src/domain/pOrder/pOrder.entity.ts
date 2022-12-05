import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DateColumns } from '../embedded/dateColumns';
import { User } from '../user/user.entity';
import { POrderState } from './pOrder.enum';

@Entity()
export class POrder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column({ type: 'enum', name: 'orderState', enum: POrderState })
  orderState: POrderState;

  @Column(() => DateColumns, { prefix: false })
  dateColumns: DateColumns;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
}

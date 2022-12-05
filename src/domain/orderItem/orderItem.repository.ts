import { Repository } from 'typeorm';
import { CustomRepository } from '../../module/typeorm/typeorm.decorator';
import { OrderItem } from './orderItem.entity';

@CustomRepository(OrderItem)
export class OrderItemRepository extends Repository<OrderItem> {}

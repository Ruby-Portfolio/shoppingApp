import { Repository } from 'typeorm';
import { CustomRepository } from '../../module/typeorm/typeorm.decorator';
import { POrder } from './pOrder.entity';
import { OrderItem } from '../orderItem/orderItem.entity';
import { Product } from '../product/product.entity';
import { OrdersDto } from './pOrder.dto';

@CustomRepository(POrder)
export class POrderRepository extends Repository<POrder> {
  async getOrdersByUser(userId: number): Promise<OrdersDto> {
    const orders = await this.createQueryBuilder('pOrder')
      .leftJoin(OrderItem, 'orderItem', 'orderItem.pOrderId = pOrder.id')
      .leftJoin(Product, 'product', 'product.id = orderItem.productId')
      .select([
        'pOrder.id as orderId',
        'SUM(product.price * orderItem.count) as totalPrice',
      ])
      .where('pOrder.userId = :userId', { userId })
      .groupBy('pOrder.id')
      .orderBy('pOrder.id', 'DESC')
      .getRawMany();

    // TypeORM 집계 함수 결과가 숫자가 아닌 문자열로 반환되어 값을 보정
    orders.forEach((order) => {
      if (typeof order.totalPrice === 'string') {
        order.totalPrice = parseInt(order.totalPrice);
      }
    });

    return { orders };
  }
}

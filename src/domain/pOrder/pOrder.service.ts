import { Injectable } from '@nestjs/common';
import { POrderRepository } from './pOrder.repository';
import { OrderCreateDto } from './pOrder.dto';
import { OrderItemRepository } from '../orderItem/orderItem.repository';
import { POrderInsertFailException } from './pOrder.exception';

@Injectable()
export class POrderService {
  constructor(
    private readonly pOrderRepository: POrderRepository,
    private readonly orderItemRepository: OrderItemRepository,
  ) {}

  async createOrder({ products }: OrderCreateDto, userId: number) {
    // TODO : insert 가 여러번 발생하므로 transaction 을 적용해야함

    const order = await this.pOrderRepository.save({
      userId,
    });

    if (!order) {
      throw new POrderInsertFailException();
    }

    const orderItems = products.map((product) => ({
      ...product,
      pOrder: order,
    }));

    const insertResult = await this.orderItemRepository
      .insert(orderItems)
      .then(
        (insertResult) => insertResult?.raw?.affectedRows === orderItems.length,
      );

    if (!insertResult) {
      throw new POrderInsertFailException();
    }
  }

  async cancelOrder() {}

  async getOrdersByUser() {}
}

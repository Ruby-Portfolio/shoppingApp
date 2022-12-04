import { Injectable } from '@nestjs/common';
import { POrderRepository } from './pOrder.repository';
import { OrderCreateDto } from './pOrder.dto';
import { OrderItemRepository } from '../orderItem/orderItem.repository';
import { POrderInsertFailException } from './pOrder.exception';
import { ProductNotFoundException } from '../product/product.exception';
import { DataSource, EntityManager } from 'typeorm';
import { wrapTransaction } from '../../common/transaction';
import { POrder } from './pOrder.entity';
import { OrderItem } from '../orderItem/orderItem.entity';

@Injectable()
export class POrderService {
  constructor(
    private dataSource: DataSource,
    private readonly pOrderRepository: POrderRepository,
    private readonly orderItemRepository: OrderItemRepository,
  ) {}

  async createOrder(orderCreateDto: OrderCreateDto, userId: number) {
    await wrapTransaction(
      this.dataSource,
      async (entityManager: EntityManager) => {
        const order = await entityManager
          .getRepository(POrder)
          .save({
            userId,
          })
          .catch(() => {
            throw new POrderInsertFailException();
          });

        const orderItems = orderCreateDto.orderItems.map((product) => ({
          ...product,
          pOrder: order,
        }));

        await entityManager
          .getRepository(OrderItem)
          .insert(orderItems)
          .then(
            (insertResult) =>
              insertResult?.raw?.affectedRows === orderItems.length,
          )
          .catch(() => {
            throw new ProductNotFoundException();
          });
      },
    );
  }

  async cancelOrder() {}

  async getOrdersByUser() {}
}

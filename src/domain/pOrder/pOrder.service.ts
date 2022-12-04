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

  async createOrder({ products }: OrderCreateDto, userId: number) {
    console.log('==========');

    await wrapTransaction(
      this.dataSource,
      async (entityManager: EntityManager) => {
        const order = await entityManager.getRepository(POrder).save({
          userId,
        });

        if (!order) {
          throw new POrderInsertFailException();
        }

        const orderItems = products.map((product) => ({
          ...product,
          pOrder: order,
        }));

        const insertResult = await entityManager
          .getRepository(OrderItem)
          .insert(orderItems)
          .then(
            (insertResult) =>
              insertResult?.raw?.affectedRows === orderItems.length,
          );

        if (!insertResult) {
          throw new ProductNotFoundException();
        }
      },
    );
  }

  async cancelOrder() {}

  async getOrdersByUser() {}
}

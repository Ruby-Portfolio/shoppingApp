import { OrderItemDto } from '../orderItem/orderItem.dto';
import { IsOrderItem } from '../orderItem/orderItem.validator';
import { OrderItemErrorMessage } from '../orderItem/orderItem.message';

export class OrderCreateDto {
  @IsOrderItem({ message: OrderItemErrorMessage.ORDER_ITEM_INVALID })
  orderItems: OrderItemDto[];
}

export class OrdersDto {
  orders: {
    orderId: number;
    totalPrice: bigint;
  }[];
}

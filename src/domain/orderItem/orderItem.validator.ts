import { registerDecorator, ValidationOptions } from 'class-validator';
import { OrderItemDto } from './orderItem.dto';

export const IsOrderItem: Function = (
  validationOptions?: ValidationOptions,
): Function => {
  return (object: Object, propertyName: string): void => {
    registerDecorator({
      name: 'isOrderItem',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(orderItems: OrderItemDto[]): boolean {
          return orderItems.every(
            (orderItem) => orderItem.productId > 0 && orderItem.count > 0,
          );
        },
      },
    });
  };
};

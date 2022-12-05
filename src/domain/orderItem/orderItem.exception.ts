import { HttpException, HttpStatus } from '@nestjs/common';

export class OrderItemNotFoundException extends HttpException {
  constructor() {
    super(OrderItemNotFoundException.ERROR_MESSAGE, HttpStatus.NOT_FOUND);
  }

  public static readonly ERROR_MESSAGE = '주문 상품 정보를 찾을 수 없습니다.';
}

import { HttpException, HttpStatus } from '@nestjs/common';

export class ProductInsertFailException extends HttpException {
  constructor() {
    super(
      ProductInsertFailException.ERROR_MESSAGE,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  public static readonly ERROR_MESSAGE = '상품 정보 등록에 실패하였습니다.';
}

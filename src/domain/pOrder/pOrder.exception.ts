import { HttpException, HttpStatus } from '@nestjs/common';

export class POrderInsertFailException extends HttpException {
  constructor() {
    super(
      POrderInsertFailException.ERROR_MESSAGE,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  public static readonly ERROR_MESSAGE = '주문을 실패하였습니다.';
}

export class POrderNotFoundException extends HttpException {
  constructor() {
    super(POrderNotFoundException.ERROR_MESSAGE, HttpStatus.NOT_FOUND);
  }

  public static readonly ERROR_MESSAGE = '주문 정보를 찾을 수 없습니다.';
}

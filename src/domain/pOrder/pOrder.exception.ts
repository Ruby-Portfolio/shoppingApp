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

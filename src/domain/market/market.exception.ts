import { HttpException, HttpStatus } from '@nestjs/common';

export class MarketInsertFailException extends HttpException {
  constructor() {
    super(
      MarketInsertFailException.ERROR_MESSAGE,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  public static readonly ERROR_MESSAGE = '마켓 정보 등록에 실패하였습니다.';
}

export class MarketNotFoundException extends HttpException {
  constructor() {
    super(MarketNotFoundException.ERROR_MESSAGE, HttpStatus.NOT_FOUND);
  }

  public static readonly ERROR_MESSAGE = '마켓 정보를 찾을 수 없습니다.';
}

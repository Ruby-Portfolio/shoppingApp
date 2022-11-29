import { HttpException, HttpStatus } from "@nestjs/common";

export class UserNotFoundException extends HttpException {
  constructor() {
    super(UserNotFoundException.ERROR_MESSAGE, HttpStatus.NOT_FOUND);
  }

  public static readonly ERROR_MESSAGE = '사용자 정보를 찾을 수 없습니다';
}

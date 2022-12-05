import { HttpException, HttpStatus } from "@nestjs/common";

export class InvalidIdException extends HttpException {
  constructor() {
    super(InvalidIdException.ERROR_MESSAGE, HttpStatus.BAD_REQUEST);
  }

  public static readonly ERROR_MESSAGE = '잘못된 id 값입니다.'
}

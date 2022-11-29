import { ArgumentMetadata, Injectable, PipeTransform } from "@nestjs/common";
import { InvalidIdException } from "../exception/id.exception";

@Injectable()
export class IdPipe implements PipeTransform {

  isId(id: number) {
    return id > 0;
  }

  transform(id: number, metadata: ArgumentMetadata): number {
    if (this.isId(id)) {
      return id;
    }

    throw new InvalidIdException();
  }
}
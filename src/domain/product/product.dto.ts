import { IsInt, IsOptional, Length, Min } from 'class-validator';
import { ProductErrorMessage } from './product.message';
import { IsId } from '../../common/validator/id.validator';
import { MarketErrorMessage } from '../market/market.message';

export class ProductDto {
  @Length(1, 20, { message: ProductErrorMessage.NAME_LENGTH })
  name: string;

  @IsInt({ message: ProductErrorMessage.PRICE_POSITIVE })
  @Min(1, { message: ProductErrorMessage.PRICE_POSITIVE })
  price: number;

  @IsOptional()
  description?: string;

  @IsId({ message: MarketErrorMessage.ID_POSITIVE })
  marketId: number;
}

export class ProductDeleteDto {
  @IsId({ message: MarketErrorMessage.ID_POSITIVE })
  marketId: number;
}

export class ProductDetailDto {
  id: number;
  name: string;
  price: number;
  description?: string;
  marketName: string;
  userName: string;
}

export class ProductsSearch {
  @IsOptional()
  keyword: string = '';

  @IsOptional()
  @Min(0, { message: ProductErrorMessage.PAGE_POSITIVE })
  page: number = 0;
}

export class ProductsDto {
  products: {
    id: number;
    name: string;
    price: number;
  }[];
}

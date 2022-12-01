import { IsInt, IsOptional, Length, Min } from 'class-validator';
import { ProductErrorMessage } from './product.message';
import { IsId } from '../../common/validator/id.validator';
import { MarketErrorMessage } from '../market/market.message';

export class ProductCreate {
  @Length(1, 20, { message: ProductErrorMessage.NAME_LENGTH })
  name: string;

  @IsInt({ message: ProductErrorMessage.PRICE_POSITIVE })
  @Min(1, { message: ProductErrorMessage.PRICE_POSITIVE })
  price: number;

  @IsInt({ message: ProductErrorMessage.PRICE_POSITIVE })
  @Min(1, { message: ProductErrorMessage.PRICE_POSITIVE })
  stock: number;

  @IsOptional()
  description: string;

  @IsId({ message: MarketErrorMessage.ID_POSITIVE })
  marketId: number;
}

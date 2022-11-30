import { IsOptional, Length } from 'class-validator';
import { MarketErrorMessage } from './market.message';

export class MarketCreate {
  @Length(1, 20, { message: MarketErrorMessage.MARKET_NAME_LENGTH })
  name: string;

  @IsOptional()
  description: string;
}

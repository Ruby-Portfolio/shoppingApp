import { IsOptional, Length } from 'class-validator';
import { MarketErrorMessage } from './market.message';

export class MarketDto {
  @Length(1, 20, { message: MarketErrorMessage.NAME_LENGTH })
  name: string;

  @IsOptional()
  description?: string;
}

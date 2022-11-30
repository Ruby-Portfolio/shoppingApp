import { Injectable } from '@nestjs/common';
import { UserRepository } from '../user/user.repository';
import { MarketRepository } from './market.repository';
import { MarketCreate } from './market.dto';
import { MarketInsertFailException } from './market.exception';

@Injectable()
export class MarketService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly marketRepository: MarketRepository,
  ) {}

  async createMarket(
    marketCreate: MarketCreate,
    userId: number,
  ): Promise<void> {
    const insertResult = await this.marketRepository
      .insert({
        ...marketCreate,
        userId,
      })
      .then((insertResult) => !!insertResult.raw.affectedRows);

    if (!insertResult) {
      throw new MarketInsertFailException();
    }
  }
}

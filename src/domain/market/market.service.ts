import { Injectable } from '@nestjs/common';
import { UserRepository } from '../user/user.repository';
import { MarketRepository } from './market.repository';
import { MarketCreate, MarketUpdate } from './market.dto';
import {
  MarketInsertFailException,
  MarketUpdateFailException,
} from './market.exception';

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

  async updateMarket(
    marketId: number,
    marketUpdate: MarketUpdate,
    userId: number,
  ): Promise<void> {
    const updateResult = await this.marketRepository
      .update({ id: marketId }, { ...marketUpdate, userId })
      .then((updateResult) => !!updateResult.raw.affectedRows);

    if (!updateResult) {
      throw new MarketUpdateFailException();
    }
  }
}

import { Injectable } from '@nestjs/common';
import { MarketRepository } from './market.repository';
import { MarketDto } from './market.dto';
import {
  MarketInsertFailException,
  MarketNotFoundException,
} from './market.exception';
import { MarketCache } from './market.cache';

@Injectable()
export class MarketService {
  constructor(
    private readonly marketRepository: MarketRepository,
    private readonly marketCache: MarketCache,
  ) {}

  async createMarket(marketDto: MarketDto, userId: number): Promise<void> {
    const insertResult = await this.marketRepository
      .insert({
        ...marketDto,
        userId,
      })
      .then((insertResult) => !!insertResult.raw.affectedRows);

    if (!insertResult) {
      throw new MarketInsertFailException();
    }
  }

  async updateMarket(
    marketId: number,
    marketDto: MarketDto,
    userId: number,
  ): Promise<void> {
    const updateResult = await this.marketRepository
      .update({ id: marketId }, { ...marketDto, userId })
      .then((updateResult) => !!updateResult?.affected);

    if (!updateResult) {
      throw new MarketNotFoundException();
    }

    // TODO : 마켓과 마켓에 속한 상품 캐시데이터를 모두 삭제해야함, market, productDetail*
    await this.marketCache.deleteMarketCache(marketId, userId);
  }

  async deleteMarket(marketId: number, userId: number): Promise<void> {
    const deleteResult = await this.marketRepository
      .softDelete({
        id: marketId,
        userId,
      })
      .then((updateResult) => !!updateResult?.affected);

    if (!deleteResult) {
      throw new MarketNotFoundException();
    }

    // TODO : 마켓과 마켓에 속한 상품 캐시데이터를 모두 삭제해야함
    await this.marketCache.deleteMarketCache(marketId, userId);
  }
}

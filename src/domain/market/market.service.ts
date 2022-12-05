import { Injectable } from '@nestjs/common';
import { MarketRepository } from './market.repository';
import { MarketDto } from './market.dto';
import {
  MarketInsertFailException,
  MarketNotFoundException,
} from './market.exception';
import { ProductCache } from '../product/product.cache';

@Injectable()
export class MarketService {
  constructor(
    private readonly marketRepository: MarketRepository,
    private readonly productCache: ProductCache,
  ) {}

  async createMarket(marketDto: MarketDto, userId: number): Promise<void> {
    await this.marketRepository
      .insert({
        ...marketDto,
        userId,
      })
      .catch(() => {
        throw new MarketInsertFailException();
      });
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

    await this.productCache.getDeleteProductsCacheByMarket(marketId);
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

    await this.productCache.getDeleteProductsCacheByMarket(marketId);
  }
}

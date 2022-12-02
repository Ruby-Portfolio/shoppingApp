import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Market } from './market.entity';
import { MarketRepository } from './market.repository';

@Injectable()
export class MarketCache {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly marketRepository: MarketRepository,
  ) {}

  getMarketCacheKey(marketId: number, userId: number): string {
    return `market_${marketId}_${userId}`;
  }

  async getMarketCache(marketId: number, userId: number): Promise<Market> {
    const marketKey = this.getMarketCacheKey(marketId, userId);
    let market = (await this.cacheManager.get(marketKey)) as Market;

    if (!market) {
      market = await this.marketRepository.findOneBy({ id: marketId, userId });
      market && (await this.cacheManager.set(marketKey, market));
    }

    return market;
  }

  async deleteMarketCache(marketId: number, userId: number) {
    const marketKey = this.getMarketCacheKey(marketId, userId);
    await this.cacheManager.del(marketKey);
  }
}

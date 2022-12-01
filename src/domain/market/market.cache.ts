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

  async getMarketCache(marketId: number, userId: number): Promise<Market> {
    const marketKey = `market_${marketId}_${userId}`;
    return (await this.cacheManager
      .get(marketKey)
      .then(
        (market) =>
          market || this.marketRepository.findOneBy({ id: marketId, userId }),
      )) as Market;
  }
}

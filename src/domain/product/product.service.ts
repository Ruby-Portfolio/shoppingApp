import { Injectable } from '@nestjs/common';
import { MarketRepository } from '../market/market.repository';
import { ProductRepository } from './product.repository';
import { ProductCreate } from './product.dto';
import { MarketCache } from '../market/market.cache';
import { ProductInsertFailException } from './product.exception';
import { MarketNotFoundException } from '../market/market.exception';

@Injectable()
export class ProductService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly marketRepository: MarketRepository,
    private readonly marketCache: MarketCache,
  ) {}

  async createProduct(
    productCreate: ProductCreate,
    userId: number,
  ): Promise<void> {
    const marketId = productCreate.marketId;
    const market = await this.marketCache.getMarketCache(marketId, userId);

    if (!market) {
      throw new MarketNotFoundException();
    }

    const insertResult = await this.productRepository
      .insert(productCreate)
      .then((insertResult) => !!insertResult?.raw?.affectedRows);

    if (!insertResult) {
      throw new ProductInsertFailException();
    }
  }
}

import { Injectable } from '@nestjs/common';
import { MarketRepository } from '../market/market.repository';
import { ProductRepository } from './product.repository';
import { ProductDto } from './product.dto';
import { MarketCache } from '../market/market.cache';
import {
  ProductInsertFailException,
  ProductNotFoundException,
} from './product.exception';
import { MarketNotFoundException } from '../market/market.exception';

@Injectable()
export class ProductService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly marketRepository: MarketRepository,
    private readonly marketCache: MarketCache,
  ) {}

  async createProduct(productDto: ProductDto, userId: number): Promise<void> {
    const marketId = productDto.marketId;
    const market = await this.marketCache.getMarketCache(marketId, userId);

    if (!market) {
      throw new MarketNotFoundException();
    }

    const insertResult = await this.productRepository
      .insert(productDto)
      .then((insertResult) => !!insertResult?.raw?.affectedRows);

    if (!insertResult) {
      throw new ProductInsertFailException();
    }
  }

  async updateProduct(
    productId: number,
    productDto: ProductDto,
    userId: number,
  ) {
    const marketId = productDto.marketId;
    await this.marketCache.getMarketCache(marketId, userId);

    const updateResult = await this.productRepository.updateProduct(
      productId,
      productDto,
    );

    if (!updateResult) {
      throw new ProductNotFoundException();
    }
  }
}

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
import { Product } from './product.entity';
import { ProductCache } from './product.cache';

@Injectable()
export class ProductService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly marketRepository: MarketRepository,
    private readonly marketCache: MarketCache,
    private readonly productCache: ProductCache,
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
    const market = await this.marketCache.getMarketCache(marketId, userId);

    if (!market) {
      throw new MarketNotFoundException();
    }

    const updateResult = await this.productRepository
      .update({ id: productId, marketId }, {
        ...productDto,
        marketId,
      } as Product)
      .then((updateResult) => !!updateResult?.affected);

    if (!updateResult) {
      throw new ProductNotFoundException();
    }

    await this.productCache.deleteProductDetailCache(productId);
  }

  async deleteProduct(productId: number, marketId: number, userId: number) {
    const market = await this.marketCache.getMarketCache(marketId, userId);

    if (!market) {
      throw new MarketNotFoundException();
    }

    const deleteResult = await this.productRepository
      .softDelete({
        id: productId,
        marketId,
      })
      .then((updateResult) => !!updateResult.affected);

    if (!deleteResult) {
      throw new ProductNotFoundException();
    }

    await this.productCache.deleteProductDetailCache(productId);
  }
}

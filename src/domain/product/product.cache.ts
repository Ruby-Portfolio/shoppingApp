import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { ProductRepository } from './product.repository';
import { ProductDetailDto } from './product.dto';

@Injectable()
export class ProductCache {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly productRepository: ProductRepository,
  ) {}

  getProductDetailCacheKey(productId: number): string {
    return `productDetail_${productId}`;
  }

  async getProductDetailCache(productId: number): Promise<ProductDetailDto> {
    const productDetailKey = this.getProductDetailCacheKey(productId);
    let productDetail = (await this.cacheManager.get(
      productDetailKey,
    )) as ProductDetailDto;

    if (!productDetail) {
      productDetail = await this.productRepository.getProductDetail(productId);
      productDetail &&
        (await this.cacheManager.set(productDetailKey, productDetail));
    }

    return productDetail;
  }

  async deleteProductDetailCache(productId: number): Promise<void> {
    const productDetailKey = this.getProductDetailCacheKey(productId);
    await this.cacheManager.del(productDetailKey);
  }
}

import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { ProductRepository } from './product.repository';
import { ProductDetailDto, ProductsDto, ProductsSearch } from './product.dto';

@Injectable()
export class ProductCache {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly productRepository: ProductRepository,
  ) {}

  getProductDetailCacheKey(productId: number): string {
    return `productDetail_${productId}`;
  }

  getProductsCacheKey(productsSearch: ProductsSearch): string {
    return `products_${productsSearch.keyword}_${productsSearch.page}`;
  }

  async getProductDetailCache(productId: number): Promise<ProductDetailDto> {
    const productDetailKey = this.getProductDetailCacheKey(productId);
    let productDetail: ProductDetailDto = await this.cacheManager.get(
      productDetailKey,
    );

    if (!productDetail) {
      productDetail = await this.productRepository.getProductDetail(productId);
      productDetail &&
        (await this.cacheManager.set(productDetailKey, productDetail));
    }

    return productDetail;
  }

  async getProductsCache(productsSearch: ProductsSearch): Promise<ProductsDto> {
    const productsKey = this.getProductsCacheKey(productsSearch);
    let products: ProductsDto = await this.cacheManager.get(productsKey);

    if (!products) {
      products = await this.productRepository.getProducts(productsSearch);
      products && (await this.cacheManager.set(productsKey, products));
    }

    return products;
  }

  async deleteProductDetailCache(productId: number): Promise<void> {
    const productDetailKey = this.getProductDetailCacheKey(productId);
    await this.cacheManager.del(productDetailKey);
  }
}

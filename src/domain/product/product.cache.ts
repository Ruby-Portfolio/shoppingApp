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

  async getProductDetailCache(productId: number): Promise<ProductDetailDto> {
    const productDetailKey = `productDetail_${productId}`;
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
    const productsKey = `products_${productsSearch.keyword}_${productsSearch.page}`;
    let products: ProductsDto = await this.cacheManager.get(productsKey);

    if (!products) {
      products = await this.productRepository.getProducts(productsSearch);
      products && (await this.cacheManager.set(productsKey, products));
    }

    return products;
  }
}

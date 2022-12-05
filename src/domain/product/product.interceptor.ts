import {
  CacheInterceptor,
  CallHandler,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class ProductCacheInterceptor extends CacheInterceptor {
  private readonly CACHE_PRODUCT_TARGET_METHODS = ['PATCH', 'PUT', 'DELETE'];
  private readonly CACHE_PRODUCTS_TARGET_METHODS = [
    'POST',
    'PATCH',
    'PUT',
    'DELETE',
  ];

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest<Request>();

    return next.handle().pipe(
      tap(async () => {
        if (this.CACHE_PRODUCT_TARGET_METHODS.includes(req.method)) {
          const { productId } = context.switchToHttp().getRequest().params;
          await this.clearProductDetailCache(productId);
        }

        if (this.CACHE_PRODUCTS_TARGET_METHODS.includes(req.method)) {
          await this.clearProductsCache();
        }
      }),
    );
  }

  /**
   * productId 에 해당하는 상품 캐시 데이터 초기화
   * @param productId
   */
  async clearProductDetailCache(productId: number): Promise<void> {
    const productDetailKey = `productDetail_${productId}`;
    await this.cacheManager.del(productDetailKey);
  }

  /**
   * 상품 추가, 수정, 삭제시 상품 목록 캐시 초기화
   */
  async clearProductsCache(): Promise<void> {
    const productsKeys = await this.cacheManager.store.keys('products*');

    await Promise.all(
      productsKeys.map((productsKey) => this.cacheManager.del(productsKey)),
    );
  }
}

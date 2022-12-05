import {
  CacheInterceptor,
  CallHandler,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class MarketCacheInterceptor extends CacheInterceptor {
  private readonly CACHE_PRODUCT_TARGET_METHODS = ['PATCH', 'PUT', 'DELETE'];

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest<Request>();

    return next.handle().pipe(
      tap(async () => {
        if (this.CACHE_PRODUCT_TARGET_METHODS.includes(req.method)) {
          const { marketId } = context.switchToHttp().getRequest().params;

          await this.clearMarketCache(marketId);
        }
      }),
    );
  }

  /**
   * marketId 에 해당하는 상품 캐시 데이터 초기화
   * @param marketId
   */
  async clearMarketCache(marketId: number): Promise<void> {
    const marketKey = `market_${marketId}`;
    await this.cacheManager.del(marketKey);
  }
}

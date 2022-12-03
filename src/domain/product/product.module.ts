import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { CustomTypeOrmModule } from '../../module/typeorm/typeorm.module';
import { MarketRepository } from '../market/market.repository';
import { ProductRepository } from './product.repository';
import { MarketCache } from '../market/market.cache';
import { ProductCache } from './product.cache';

@Module({
  imports: [
    CustomTypeOrmModule.forCustomRepository([
      ProductRepository,
      MarketRepository,
    ]),
  ],
  providers: [ProductService, MarketCache, ProductCache],
  controllers: [ProductController],
})
export class ProductModule {}

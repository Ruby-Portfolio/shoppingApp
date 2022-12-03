import { Module } from '@nestjs/common';
import { MarketService } from './market.service';
import { MarketController } from './market.controller';
import { CustomTypeOrmModule } from '../../module/typeorm/typeorm.module';
import { MarketRepository } from './market.repository';
import { ProductCache } from '../product/product.cache';
import { ProductRepository } from '../product/product.repository';

@Module({
  imports: [
    CustomTypeOrmModule.forCustomRepository([
      MarketRepository,
      ProductRepository,
    ]),
  ],
  providers: [MarketService, ProductCache],
  controllers: [MarketController],
})
export class MarketModule {}

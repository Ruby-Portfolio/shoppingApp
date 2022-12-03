import { Module } from '@nestjs/common';
import { MarketService } from './market.service';
import { MarketController } from './market.controller';
import { CustomTypeOrmModule } from '../../module/typeorm/typeorm.module';
import { MarketRepository } from './market.repository';
import { ProductCache } from '../product/product.cache';

@Module({
  imports: [CustomTypeOrmModule.forCustomRepository([MarketRepository])],
  providers: [MarketService, ProductCache],
  controllers: [MarketController],
})
export class MarketModule {}

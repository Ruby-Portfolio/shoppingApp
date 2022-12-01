import { Module } from '@nestjs/common';
import { MarketService } from './market.service';
import { MarketController } from './market.controller';
import { CustomTypeOrmModule } from '../../module/typeorm/typeorm.module';
import { MarketRepository } from './market.repository';
import { MarketCache } from './market.cache';

@Module({
  imports: [CustomTypeOrmModule.forCustomRepository([MarketRepository])],
  providers: [MarketService, MarketCache],
  controllers: [MarketController],
})
export class MarketModule {}

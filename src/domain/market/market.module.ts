import { Module } from '@nestjs/common';
import { MarketService } from './market.service';
import { MarketController } from './market.controller';
import { CustomTypeOrmModule } from '../../module/typeorm/typeorm.module';
import { MarketRepository } from './market.repository';

@Module({
  imports: [CustomTypeOrmModule.forCustomRepository([MarketRepository])],
  providers: [MarketService],
  controllers: [MarketController],
})
export class MarketModule {}

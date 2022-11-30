import { Module } from '@nestjs/common';
import { MarketService } from './market.service';
import { MarketController } from './market.controller';
import { CustomTypeOrmModule } from '../../module/typeorm/typeorm.module';
import { MarketRepository } from './market.repository';
import { UserRepository } from '../user/user.repository';

@Module({
  imports: [
    CustomTypeOrmModule.forCustomRepository([MarketRepository, UserRepository]),
  ],
  providers: [MarketService],
  controllers: [MarketController],
})
export class MarketModule {}

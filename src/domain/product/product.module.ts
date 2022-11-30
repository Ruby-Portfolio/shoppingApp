import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { CustomTypeOrmModule } from '../../module/typeorm/typeorm.module';
import { MarketRepository } from '../market/market.repository';
import { UserRepository } from '../user/user.repository';
import { ProductRepository } from './product.repository';

@Module({
  imports: [
    CustomTypeOrmModule.forCustomRepository([
      ProductRepository,
      MarketRepository,
      UserRepository,
    ]),
  ],
  providers: [ProductService],
  controllers: [ProductController],
})
export class ProductModule {}

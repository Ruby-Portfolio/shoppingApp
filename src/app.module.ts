import { CacheModule, MiddlewareConsumer, Module } from '@nestjs/common';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './module/auth/auth.module';
import { User } from './domain/user/user.entity';
import { MarketModule } from './domain/market/market.module';
import { Market } from './domain/market/market.entity';
import { Product } from './domain/product/product.entity';
import * as redisStore from 'cache-manager-ioredis';
import { ProductModule } from './domain/product/product.module';
import { POrder } from './domain/pOrder/pOrder.entity';
import { OrderItem } from './domain/orderItem/orderItem.entity';
import { POrderModule } from './domain/pOrder/pOrder.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: [User, Market, Product, POrder, OrderItem],
      charset: 'utf8mb4',
      synchronize: true,
      logging: true,
    }),
    CacheModule.register({
      store: redisStore,
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      ttl: +process.env.REDIS_TTL,
      isGlobal: true,
    }),
    AuthModule,
    MarketModule,
    ProductModule,
    POrderModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer): any {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}

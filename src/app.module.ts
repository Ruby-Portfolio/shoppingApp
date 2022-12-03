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
      entities: [User, Market, Product],
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
  ],
  controllers: [],
  providers: [],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer): any {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}

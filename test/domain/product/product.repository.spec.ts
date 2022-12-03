import { CacheModule } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { MarketRepository } from '../../../src/domain/market/market.repository';
import { Market } from '../../../src/domain/market/market.entity';
import * as redisStore from 'cache-manager-ioredis';
import { ProductRepository } from '../../../src/domain/product/product.repository';
import { ProductDetailDto } from '../../../src/domain/product/product.dto';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../../src/domain/user/user.entity';
import { Product } from '../../../src/domain/product/product.entity';
import { CustomTypeOrmModule } from '../../../src/module/typeorm/typeorm.module';
import { UserRepository } from '../../../src/domain/user/user.repository';

describe('ProductRepository', () => {
  let userRepository: UserRepository;
  let marketRepository: MarketRepository;
  let productRepository: ProductRepository;
  let user: User;
  let market: Market;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
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
        CustomTypeOrmModule.forCustomRepository([
          UserRepository,
          MarketRepository,
          ProductRepository,
        ]),
      ],
      providers: [UserRepository, MarketRepository, ProductRepository],
    }).compile();

    userRepository = module.get<UserRepository>(UserRepository);
    marketRepository = module.get<MarketRepository>(MarketRepository);
    productRepository = module.get<ProductRepository>(ProductRepository);

    await productRepository.delete({});
    await marketRepository.delete({});
    await userRepository.delete({});

    user = await userRepository.save({
      name: 'ruby',
      email: 'ruby@gmail.com',
      provider: 'google',
      providerId: '124312',
    });
    market = await marketRepository.save({
      name: '루비 상점',
      description: '루비의 상점입니다.',
      userId: user.id,
    });
  });

  afterAll(async () => {
    await productRepository.delete({});
    await marketRepository.delete({});
    await userRepository.delete({});
  });

  describe('getProductDetail - 상품 정보 상세 조회', () => {
    let product: Product;
    beforeAll(async () => {
      product = await productRepository.save({
        name: '플루트',
        price: 10000000,
        stock: 10,
        description: '관악기',
        marketId: market.id,
      });
    });

    test('상품 정보 상세 조회', async () => {
      const productDetail: ProductDetailDto =
        await productRepository.getProductDetail(product.id);

      expect(productDetail.id).toEqual(product.id);
      expect(productDetail.name).toEqual(product.name);
      expect(productDetail.price).toEqual(product.price);
      expect(productDetail.stock).toEqual(product.stock);
      expect(productDetail.description).toEqual(product.description);
      expect(productDetail.marketName).toEqual(market.name);
      expect(productDetail.userName).toEqual(user.name);
    });
  });
});

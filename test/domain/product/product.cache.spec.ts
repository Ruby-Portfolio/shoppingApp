import { CACHE_MANAGER, CacheModule } from '@nestjs/common';
import { User } from '../../../src/domain/user/user.entity';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomTypeOrmModule } from '../../../src/module/typeorm/typeorm.module';
import { UserRepository } from '../../../src/domain/user/user.repository';
import { MarketRepository } from '../../../src/domain/market/market.repository';
import { Market } from '../../../src/domain/market/market.entity';
import { Cache } from 'cache-manager';
import * as redisStore from 'cache-manager-ioredis';
import { MarketCache } from '../../../src/domain/market/market.cache';
import { ProductRepository } from '../../../src/domain/product/product.repository';
import { ProductCache } from '../../../src/domain/product/product.cache';
import { Product } from '../../../src/domain/product/product.entity';
import { ProductDetailDto } from '../../../src/domain/product/product.dto';

describe('ProductCache', () => {
  let userRepository: UserRepository;
  let marketRepository: MarketRepository;
  let productRepository: ProductRepository;
  let productCache: ProductCache;
  let cacheManager: Cache;
  let user: User;
  let market: Market;
  let product: Product;

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
      providers: [MarketCache, ProductCache],
    }).compile();

    userRepository = module.get<UserRepository>(UserRepository);
    marketRepository = module.get<MarketRepository>(MarketRepository);
    productRepository = module.get<ProductRepository>(ProductRepository);
    cacheManager = module.get(CACHE_MANAGER);
    productCache = module.get<ProductCache>(ProductCache);

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
    product = await productRepository.save({
      name: '플루트',
      price: 10000000,
      stock: 10,
      description: '관악기',
      marketId: market.id,
    });
  });

  afterAll(async () => {
    await productRepository.delete({});
    await marketRepository.delete({});
    await userRepository.delete({});
  });

  describe('getProductDetailCache - 캐시된 상품 상세 정보 조회', () => {
    describe('캐시된 상품 상세 정보가 없을 경우', () => {
      beforeAll(async () => {
        await cacheManager.reset();
      });

      test('캐시된 상품 상세 정보가 없을 경우 DB 에서 조회. 조회된 데이터를 캐싱', async () => {
        const productDetail: ProductDetailDto =
          await productCache.getProductDetailCache(product.id);
        const cacheProduct = (await cacheManager.get(
          `productDetail_${product.id}`,
        )) as ProductDetailDto;

        expect(productDetail.id).toEqual(cacheProduct.id);
        expect(productDetail.name).toEqual(cacheProduct.name);
        expect(productDetail.price).toEqual(cacheProduct.price);
        expect(productDetail.stock).toEqual(cacheProduct.stock);
        expect(productDetail.description).toEqual(cacheProduct.description);
        expect(productDetail.marketName).toEqual(cacheProduct.marketName);
        expect(productDetail.userName).toEqual(cacheProduct.userName);
      });
    });

    describe('캐시된 상품 상세 정보가 있을 경우', () => {
      beforeAll(async () => {
        const productDetail: ProductDetailDto = {
          ...product,
          marketName: market.name,
          userName: user.name,
        };

        await cacheManager.set(`productDetail_${product.id}`, productDetail);
      });

      test('캐시된 상품 상세 정보가 있을 경우 캐시에서 조회', async () => {
        jest
          .spyOn(productRepository, 'getProductDetail')
          .mockResolvedValue(Promise.resolve(null));

        const productDetail = await productCache.getProductDetailCache(
          product.id,
        );

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

  describe('deleteProductDetailCache - 캐시된 상품 상세 정보 삭제', () => {
    let productDetailKey;
    beforeAll(async () => {
      productDetailKey = `productDetail_${product.id}`;
      const productDetail: ProductDetailDto = {
        ...product,
        marketName: market.name,
        userName: user.name,
      };

      await cacheManager.reset();
      await cacheManager.set(productDetailKey, productDetail);
    });

    test('상품 id가 다를 경우 캐시 삭제되지 않음', async () => {
      await productCache.deleteProductDetailCache(product.id + 999);
      const productDetail: ProductDetailDto = await cacheManager.get(
        productDetailKey,
      );

      expect(productDetail.id).toEqual(product.id);
      expect(productDetail.name).toEqual(product.name);
      expect(productDetail.price).toEqual(product.price);
      expect(productDetail.stock).toEqual(product.stock);
      expect(productDetail.description).toEqual(product.description);
      expect(productDetail.marketName).toEqual(market.name);
      expect(productDetail.userName).toEqual(user.name);
    });

    test('캐시된 상품 상세 정보 삭제', async () => {
      await productCache.deleteProductDetailCache(product.id);
      const productDetail: ProductDetailDto = await cacheManager.get(
        productDetailKey,
      );

      expect(productDetail).toBeNull();
    });
  });
});

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
import {
  ProductDetailDto,
  ProductsDto,
  ProductsSearch,
} from '../../../src/domain/product/product.dto';

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
      name: '?????? ??????',
      description: '????????? ???????????????.',
      userId: user.id,
    });
    product = await productRepository.save({
      name: '?????????',
      price: 10000000,
      stock: 10,
      description: '?????????',
      marketId: market.id,
    });
  });

  afterAll(async () => {
    await productRepository.delete({});
    await marketRepository.delete({});
    await userRepository.delete({});
  });

  describe('getProductDetailCache - ????????? ?????? ?????? ?????? ??????', () => {
    describe('????????? ?????? ?????? ????????? ?????? ??????', () => {
      beforeAll(async () => {
        await cacheManager.reset();
      });

      test('????????? ?????? ?????? ????????? ?????? ?????? DB ?????? ??????. ????????? ???????????? ??????', async () => {
        const productDetail: ProductDetailDto =
          await productCache.getProductDetailCache(product.id);
        const cacheProduct = (await cacheManager.get(
          `productDetail_${product.id}`,
        )) as ProductDetailDto;

        expect(productDetail.id).toEqual(cacheProduct.id);
        expect(productDetail.name).toEqual(cacheProduct.name);
        expect(productDetail.price).toEqual(cacheProduct.price);
        expect(productDetail.description).toEqual(cacheProduct.description);
        expect(productDetail.marketName).toEqual(cacheProduct.marketName);
        expect(productDetail.userName).toEqual(cacheProduct.userName);
      });
    });

    describe('????????? ?????? ?????? ????????? ?????? ??????', () => {
      beforeAll(async () => {
        const productDetail: ProductDetailDto = {
          ...product,
          marketName: market.name,
          userName: user.name,
        };

        await cacheManager.set(`productDetail_${product.id}`, productDetail);
      });

      test('????????? ?????? ?????? ????????? ?????? ?????? ???????????? ??????', async () => {
        jest
          .spyOn(productRepository, 'getProductDetail')
          .mockResolvedValue(Promise.resolve(null));

        const productDetail = await productCache.getProductDetailCache(
          product.id,
        );

        expect(productDetail.id).toEqual(product.id);
        expect(productDetail.name).toEqual(product.name);
        expect(productDetail.price).toEqual(product.price);
        expect(productDetail.description).toEqual(product.description);
        expect(productDetail.marketName).toEqual(market.name);
        expect(productDetail.userName).toEqual(user.name);
      });
    });
  });

  describe('getProductsCache - ????????? ?????? ?????? ??????', () => {
    describe('????????? ?????? ????????? ?????? ??????', () => {
      beforeAll(async () => {
        await cacheManager.reset();
      });

      test('????????? ?????? ????????? ?????? ?????? DB ?????? ??????, ????????? ???????????? ??????', async () => {
        const products = new ProductsDto();
        jest
          .spyOn(productRepository, 'getProducts')
          .mockResolvedValue(products);

        const productsSearch: ProductsSearch = {
          keyword: 'date',
          page: 0,
        };

        const findProducts: ProductsDto = await productCache.getProductsCache(
          productsSearch,
        );
        expect(findProducts).toEqual(products);
      });
    });

    describe('????????? ?????? ????????? ?????? ??????', () => {
      let productsKey;
      let productsSearch: ProductsSearch;
      let products: ProductsDto;
      beforeAll(async () => {
        await cacheManager.reset();
        productsSearch = {
          keyword: 'data',
          page: 0,
        };

        productsKey = `products_${productsSearch.keyword}_${productsSearch.page}`;
        products = new ProductsDto();
        await cacheManager.set(productsKey, products);
      });

      test('????????? ?????? ?????? ????????? ?????? ?????? ???????????? ??????', async () => {
        jest.spyOn(productRepository, 'getProducts').mockResolvedValue(null);

        const findProducts: ProductsDto = await productCache.getProductsCache(
          productsSearch,
        );

        expect(findProducts).toEqual(products);
      });
    });
  });

  describe('getDeleteProductsCacheByMarket - ?????? id??? ???????????? ????????? ?????? ?????? ?????????', () => {
    let productIds: number[];
    beforeAll(async () => {
      productIds = [];
      for (let i = 0; i < 7; i++) {
        productIds.push(i);
        await cacheManager.set(`productDetail_${i}`, 'data');
      }
    });

    test('?????? id??? ???????????? ????????? ?????? ?????? ?????????', async () => {
      jest
        .spyOn(productRepository, 'getProductIdsByMarket')
        .mockResolvedValue(productIds);

      await productCache.getDeleteProductsCacheByMarket(123);
      const productKeys = await cacheManager.store.keys('productDetail*');
      expect(productKeys.length).toEqual(0);
    });
  });
});

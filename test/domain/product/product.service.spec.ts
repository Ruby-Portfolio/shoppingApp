import { CacheModule } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { MarketRepository } from '../../../src/domain/market/market.repository';
import { Market } from '../../../src/domain/market/market.entity';
import * as redisStore from 'cache-manager-ioredis';
import { MarketCache } from '../../../src/domain/market/market.cache';
import { ProductRepository } from '../../../src/domain/product/product.repository';
import { ProductService } from '../../../src/domain/product/product.service';
import { ProductCreate } from '../../../src/domain/product/product.dto';
import { MarketNotFoundException } from '../../../src/domain/market/market.exception';
import { ProductInsertFailException } from '../../../src/domain/product/product.exception';
import { InsertResult } from 'typeorm';

describe('ProductService', () => {
  let productRepository: ProductRepository;
  let productService: ProductService;
  let marketCache: MarketCache;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        CacheModule.register({
          store: redisStore,
          host: process.env.REDIS_HOST,
          port: process.env.REDIS_PORT,
          ttl: +process.env.REDIS_TTL,
          isGlobal: true,
        }),
      ],
      providers: [
        ProductRepository,
        MarketRepository,
        MarketCache,
        ProductService,
      ],
    }).compile();

    productRepository = module.get<ProductRepository>(ProductRepository);
    productService = module.get<ProductService>(ProductService);
    marketCache = module.get<MarketCache>(MarketCache);
  });

  describe('createProduct - 상품 정보 저장', () => {
    describe('저장 실패', () => {
      test('마켓 id 에 해당하는 마켓이 없을 경우 예외 처리', async () => {
        jest.spyOn(marketCache, 'getMarketCache').mockResolvedValue(null);

        await expect(
          productService.createProduct({} as ProductCreate, 10),
        ).rejects.toEqual(new MarketNotFoundException());
      });

      test('마켓 정보를 DB 에 저장 중 오류 발생시 예외 처리', async () => {
        jest
          .spyOn(marketCache, 'getMarketCache')
          .mockResolvedValue(new Market());

        jest.spyOn(productRepository, 'insert').mockResolvedValue(null);

        await expect(
          productService.createProduct({} as ProductCreate, 10),
        ).rejects.toEqual(new ProductInsertFailException());
      });
    });

    describe('저장 성공', () => {
      test('마켓 정보 저장 성공', async () => {
        jest
          .spyOn(marketCache, 'getMarketCache')
          .mockResolvedValue(new Market());

        jest
          .spyOn(productRepository, 'insert')
          .mockResolvedValue({ raw: { affectedRows: 1 } } as InsertResult);

        await expect(
          productService.createProduct({} as ProductCreate, 10),
        ).resolves.toEqual(undefined);
      });
    });
  });
});

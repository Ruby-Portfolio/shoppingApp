import { CacheModule } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { MarketRepository } from '../../../src/domain/market/market.repository';
import { Market } from '../../../src/domain/market/market.entity';
import * as redisStore from 'cache-manager-ioredis';
import { MarketCache } from '../../../src/domain/market/market.cache';
import { ProductRepository } from '../../../src/domain/product/product.repository';
import { ProductService } from '../../../src/domain/product/product.service';
import { ProductDto } from '../../../src/domain/product/product.dto';
import { MarketNotFoundException } from '../../../src/domain/market/market.exception';
import {
  ProductInsertFailException,
  ProductNotFoundException,
} from '../../../src/domain/product/product.exception';
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
          productService.createProduct({} as ProductDto, 10),
        ).rejects.toEqual(new MarketNotFoundException());
      });

      test('상품 정보를 DB 에 저장 중 오류 발생시 예외 처리', async () => {
        jest
          .spyOn(marketCache, 'getMarketCache')
          .mockResolvedValue(new Market());

        jest.spyOn(productRepository, 'insert').mockResolvedValue(null);

        await expect(
          productService.createProduct({} as ProductDto, 10),
        ).rejects.toEqual(new ProductInsertFailException());
      });
    });

    describe('저장 성공', () => {
      test('상품 정보 저장 성공', async () => {
        jest
          .spyOn(marketCache, 'getMarketCache')
          .mockResolvedValue(new Market());

        jest
          .spyOn(productRepository, 'insert')
          .mockResolvedValue({ raw: { affectedRows: 1 } } as InsertResult);

        await expect(
          productService.createProduct({} as ProductDto, 10),
        ).resolves.toEqual(undefined);
      });
    });
  });

  describe('updateProduct - 상품 정보 수정', () => {
    describe('수정 실패', () => {
      test('유저 id 와 마켓 id 에 해당하는 마켓 정보가 없을 경우 예외 처리', async () => {
        const userId = 123;
        const marketId = 123;
        const productId = 123;
        const productDto: ProductDto = {
          name: '플루트',
          price: 10000000,
          stock: 10,
          description: '관악기',
          marketId: marketId,
        };

        jest.spyOn(marketCache, 'getMarketCache').mockResolvedValue(null);

        await expect(
          productService.updateProduct(productId, productDto, userId),
        ).rejects.toEqual(new MarketNotFoundException());
      });

      test('마켓 id 와 상품 id 에 해당하는 상품 정보가 없을 경우 예외 처리', async () => {
        const userId = 123;
        const marketId = 123;
        const productId = 123;
        const productDto: ProductDto = {
          name: '플루트',
          price: 10000000,
          stock: 10,
          description: '관악기',
          marketId: marketId,
        };

        jest
          .spyOn(marketCache, 'getMarketCache')
          .mockResolvedValue(new Market());
        jest.spyOn(productRepository, 'updateProduct').mockResolvedValue(false);

        await expect(
          productService.updateProduct(productId, productDto, userId),
        ).rejects.toEqual(new ProductNotFoundException());
      });
    });

    describe('수정 성공', () => {
      test('상품 정보 저장 성공', async () => {
        const userId = 123;
        const marketId = 123;
        const productId = 123;
        const productDto: ProductDto = {
          name: '플루트',
          price: 10000000,
          stock: 10,
          description: '관악기',
          marketId: marketId,
        };

        jest
          .spyOn(marketCache, 'getMarketCache')
          .mockResolvedValue(new Market());
        jest.spyOn(productRepository, 'updateProduct').mockResolvedValue(true);

        await expect(
          productService.updateProduct(productId, productDto, userId),
        ).resolves.toEqual(undefined);
      });
    });
  });
});

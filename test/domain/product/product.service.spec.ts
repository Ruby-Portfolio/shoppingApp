import { CacheModule } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { MarketRepository } from '../../../src/domain/market/market.repository';
import { Market } from '../../../src/domain/market/market.entity';
import * as redisStore from 'cache-manager-ioredis';
import { MarketCache } from '../../../src/domain/market/market.cache';
import { ProductRepository } from '../../../src/domain/product/product.repository';
import { ProductService } from '../../../src/domain/product/product.service';
import {
  ProductDetailDto,
  ProductDto,
} from '../../../src/domain/product/product.dto';
import { MarketNotFoundException } from '../../../src/domain/market/market.exception';
import {
  ProductInsertFailException,
  ProductNotFoundException,
} from '../../../src/domain/product/product.exception';
import { InsertResult, UpdateResult } from 'typeorm';
import { ProductCache } from '../../../src/domain/product/product.cache';

describe('ProductService', () => {
  let productRepository: ProductRepository;
  let productService: ProductService;
  let marketCache: MarketCache;
  let productCache: ProductCache;

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
        ProductService,
        MarketCache,
        ProductCache,
      ],
    }).compile();

    productRepository = module.get<ProductRepository>(ProductRepository);
    productService = module.get<ProductService>(ProductService);
    marketCache = module.get<MarketCache>(MarketCache);
    productCache = module.get<ProductCache>(ProductCache);
  });

  describe('createProduct - ?????? ?????? ??????', () => {
    describe('?????? ??????', () => {
      test('?????? id ??? ???????????? ????????? ?????? ?????? ?????? ??????', async () => {
        jest.spyOn(marketCache, 'getMarketCache').mockResolvedValue(null);

        await expect(
          productService.createProduct({} as ProductDto, 10),
        ).rejects.toEqual(new MarketNotFoundException());
      });

      test('?????? ????????? DB ??? ?????? ??? ?????? ????????? ?????? ??????', async () => {
        jest
          .spyOn(marketCache, 'getMarketCache')
          .mockResolvedValue(new Market());

        jest.spyOn(productRepository, 'insert').mockRejectedValue(() => {});

        await expect(
          productService.createProduct({} as ProductDto, 10),
        ).rejects.toEqual(new ProductInsertFailException());
      });
    });

    describe('?????? ??????', () => {
      test('?????? ?????? ?????? ??????', async () => {
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

  describe('updateProduct - ?????? ?????? ??????', () => {
    describe('?????? ??????', () => {
      test('?????? id ??? ?????? id ??? ???????????? ?????? ????????? ?????? ?????? ?????? ??????', async () => {
        const userId = 123;
        const marketId = 123;
        const productId = 123;
        const productDto: ProductDto = {
          name: '?????????',
          price: 10000000,
          description: '?????????',
          marketId: marketId,
        };

        jest.spyOn(marketCache, 'getMarketCache').mockResolvedValue(null);

        await expect(
          productService.updateProduct(productId, productDto, userId),
        ).rejects.toEqual(new MarketNotFoundException());
      });

      test('?????? id ??? ?????? id ??? ???????????? ?????? ????????? ?????? ?????? ?????? ??????', async () => {
        const userId = 123;
        const marketId = 123;
        const productId = 123;
        const productDto: ProductDto = {
          name: '?????????',
          price: 10000000,
          description: '?????????',
          marketId: marketId,
        };

        jest
          .spyOn(marketCache, 'getMarketCache')
          .mockResolvedValue(new Market());
        jest
          .spyOn(productRepository, 'update')
          .mockResolvedValue({ affected: 0 } as UpdateResult);

        await expect(
          productService.updateProduct(productId, productDto, userId),
        ).rejects.toEqual(new ProductNotFoundException());
      });
    });

    describe('?????? ??????', () => {
      test('?????? ?????? ?????? ??????', async () => {
        const userId = 123;
        const marketId = 123;
        const productId = 123;
        const productDto: ProductDto = {
          name: '?????????',
          price: 10000000,
          description: '?????????',
          marketId: marketId,
        };

        jest
          .spyOn(marketCache, 'getMarketCache')
          .mockResolvedValue(new Market());
        jest
          .spyOn(productRepository, 'update')
          .mockResolvedValue({ affected: 1 } as UpdateResult);

        await expect(
          productService.updateProduct(productId, productDto, userId),
        ).resolves.toEqual(undefined);
      });
    });
  });

  describe('deleteProduct - ?????? ?????? ??????', () => {
    describe('?????? ??????', () => {
      test('?????? id ??? ?????? id ??? ???????????? ?????? ????????? ?????? ?????? ?????? ??????', async () => {
        const userId = 123;
        const marketId = 123;
        const productId = 123;

        jest.spyOn(marketCache, 'getMarketCache').mockResolvedValue(null);

        await expect(
          productService.deleteProduct(productId, marketId, userId),
        ).rejects.toEqual(new MarketNotFoundException());
      });

      test('?????? id ??? ?????? id ??? ???????????? ?????? ????????? ?????? ?????? ?????? ??????', async () => {
        const userId = 123;
        const marketId = 123;
        const productId = 123;

        jest
          .spyOn(marketCache, 'getMarketCache')
          .mockResolvedValue(new Market());
        jest
          .spyOn(productRepository, 'softDelete')
          .mockResolvedValue({ affected: 0 } as UpdateResult);

        await expect(
          productService.deleteProduct(productId, marketId, userId),
        ).rejects.toEqual(new ProductNotFoundException());
      });
    });

    describe('?????? ??????', () => {
      test('?????? ?????? ?????? ??????', async () => {
        const userId = 123;
        const marketId = 123;
        const productId = 123;

        jest
          .spyOn(marketCache, 'getMarketCache')
          .mockResolvedValue(new Market());
        jest
          .spyOn(productRepository, 'softDelete')
          .mockResolvedValue({ affected: 1 } as UpdateResult);

        await expect(
          productService.deleteProduct(productId, marketId, userId),
        ).resolves.toEqual(undefined);
      });
    });
  });

  describe('getProductDetail - ?????? ?????? ??????', () => {
    describe('?????? ??????', () => {
      test('?????? ??? DB ??? ???????????? ???????????? ?????? ??????', async () => {
        const productId = 123;
        jest
          .spyOn(productCache, 'getProductDetailCache')
          .mockResolvedValue(null);

        await expect(
          productService.getProductDetail(productId),
        ).rejects.toEqual(new ProductNotFoundException());
      });
    });

    describe('?????? ??????', () => {
      test('?????? ??? DB ??? ???????????? ????????? ??????', async () => {
        const productId = 123;
        const productDetailDto: ProductDetailDto = new ProductDetailDto();
        jest
          .spyOn(productCache, 'getProductDetailCache')
          .mockResolvedValue(productDetailDto);

        await expect(
          productService.getProductDetail(productId),
        ).resolves.toEqual(productDetailDto);
      });
    });
  });
});

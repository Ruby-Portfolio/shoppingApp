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

describe('MarketCache', () => {
  let userRepository: UserRepository;
  let marketRepository: MarketRepository;
  let cacheManager: Cache;
  let marketCache: MarketCache;
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
          entities: [User, Market],
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
        ]),
      ],
      providers: [MarketCache],
    }).compile();

    const userRepository = module.get<UserRepository>(UserRepository);
    marketRepository = module.get<MarketRepository>(MarketRepository);
    cacheManager = module.get(CACHE_MANAGER);
    marketCache = module.get<MarketCache>(MarketCache);

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
    await marketRepository.delete({});
    await userRepository.delete({});
  });

  describe('getMarketCache - 캐시된 마켓 정보 조회', () => {
    describe('캐시된 마켓 정보가 없을 경우', () => {
      beforeAll(async () => {
        await cacheManager.reset();
      });

      test('캐시된 마켓 정보가 없을 경우 DB 에서 조회. 조회된 데이터를 캐싱', async () => {
        const findMarket = await marketCache.getMarketCache(market.id, user.id);
        const cacheMarket = (await cacheManager.get(
          `market_${market.id}_${user.id}`,
        )) as Market;

        expect(findMarket).toEqual(market);
        expect(cacheMarket.id).toEqual(market.id);
        expect(cacheMarket.description).toEqual(market.description);
        expect(cacheMarket.name).toEqual(market.name);
        expect(cacheMarket.userId).toEqual(market.userId);
      });
    });
    describe('캐시된 마켓 정보가 있을 경우', () => {
      beforeAll(async () => {
        await cacheManager.set(`market_${market.id}_${user.id}`, market);
      });

      test('캐시된 마켓 정보가 있을 경우 캐시에서 조회', async () => {
        jest
          .spyOn(marketRepository, 'findOneBy')
          .mockResolvedValue(Promise.resolve(null));

        const cacheMarket = await marketCache.getMarketCache(
          market.id,
          user.id,
        );

        expect(cacheMarket.id).toEqual(market.id);
        expect(cacheMarket.description).toEqual(market.description);
        expect(cacheMarket.name).toEqual(market.name);
        expect(cacheMarket.userId).toEqual(market.userId);
      });
    });
  });

  describe('deleteMarketCache - 캐시된 마켓 정보 삭제', () => {
    let marketCacheKey;
    beforeAll(async () => {
      marketCacheKey = `market_${market.id}_${user.id}`;
      await cacheManager.reset();
      await cacheManager.set(marketCacheKey, market);
    });

    test('일치하지 않는 마켓 id와 유저 id 로 마켓 정보 삭제시 캐시 삭제되지 않음', async () => {
      await marketCache.deleteMarketCache(market.id + 999, user.id + 999);
      const findMarket: Market = await cacheManager.get(marketCacheKey);

      expect(findMarket.id).toEqual(market.id);
      expect(findMarket.name).toEqual(market.name);
      expect(findMarket.description).toEqual(market.description);
      expect(findMarket.userId).toEqual(market.userId);
    });

    test('캐시된 마켓 정보 삭제', async () => {
      await marketCache.deleteMarketCache(market.id, user.id);
      const findMarket = await cacheManager.get(marketCacheKey);

      expect(findMarket).toBeNull();
    });
  });
});

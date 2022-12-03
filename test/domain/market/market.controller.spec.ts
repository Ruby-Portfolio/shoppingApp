import {
  CACHE_MANAGER,
  CacheModule,
  HttpStatus,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { User } from '../../../src/domain/user/user.entity';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomTypeOrmModule } from '../../../src/module/typeorm/typeorm.module';
import { AuthModule } from '../../../src/module/auth/auth.module';
import { MarketModule } from '../../../src/domain/market/market.module';
import { UserRepository } from '../../../src/domain/user/user.repository';
import { MarketRepository } from '../../../src/domain/market/market.repository';
import * as cookieParser from 'cookie-parser';
import * as request from 'supertest';
import { Market } from '../../../src/domain/market/market.entity';
import { JwtService } from '@nestjs/jwt';
import { Payload } from '../../../src/module/auth/jwt/jwt.payload';
import { MarketErrorMessage } from '../../../src/domain/market/market.message';
import { MarketNotFoundException } from '../../../src/domain/market/market.exception';
import * as redisStore from 'cache-manager-ioredis';
import { Cache } from 'cache-manager';

describe('MarketController (e2e)', () => {
  let app: INestApplication;
  let userRepository: UserRepository;
  let marketRepository: MarketRepository;
  let cacheManager: Cache;
  let user: User;
  let token: string;

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
        AuthModule,
        MarketModule,
        CustomTypeOrmModule.forCustomRepository([
          UserRepository,
          MarketRepository,
        ]),
      ],
    }).compile();

    app = module.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );
    app.setGlobalPrefix('api', {
      exclude: ['auth/google', 'auth/google/callback'],
    });
    await app.init();

    userRepository = module.get<UserRepository>(UserRepository);
    marketRepository = module.get<MarketRepository>(MarketRepository);
    cacheManager = module.get(CACHE_MANAGER);

    await marketRepository.delete({});
    await userRepository.delete({});
    user = await userRepository.save({
      name: 'ruby',
      email: 'ruby@gmail.com',
      provider: 'google',
      providerId: '124312',
    });
    const jwtService = module.get<JwtService>(JwtService);
    token = await jwtService.sign({ ...user } as Payload);
  });

  afterAll(async () => {
    await marketRepository.delete({});
    await userRepository.delete({});
  });

  describe('마켓 정보 등록', () => {
    afterAll(async () => {
      await marketRepository.delete({});
    });

    describe('요청 실패', () => {
      test('인증되지 않은 사용자의 마켓 정보 등록시 401 응답', async () => {
        await request(app.getHttpServer())
          .post('/api/markets')
          .send({
            name: '루비 마켓',
            description: '루비의 상점입니다.',
          })
          .expect(HttpStatus.UNAUTHORIZED);
      });

      test('마켓 정보 등록시 필요한 값들이 형식에 맞지 않을 경우 400 응답', async () => {
        const res = await request(app.getHttpServer())
          .post('/api/markets')
          .send({
            name: '',
            description: '루비의 상점입니다.',
          })
          .set('Cookie', [`Authentication=${token}`])
          .expect(HttpStatus.BAD_REQUEST);

        const errorMessages = res.body.message;
        expect(errorMessages).toContain(MarketErrorMessage.NAME_LENGTH);
      });
    });

    describe('요청 성공', () => {
      test('마켓 정보 등록 성공시 201 응답', async () => {
        const marketCreate = {
          name: '루비 마켓',
          description: '루비의 상점입니다.',
        };

        await request(app.getHttpServer())
          .post('/api/markets')
          .send({
            name: '루비 마켓',
            description: '루비의 상점입니다.',
          })
          .set('Cookie', [`Authentication=${token}`])
          .expect(HttpStatus.CREATED);

        const market = (await marketRepository.findBy({}))[0];
        expect(market.name).toEqual(marketCreate.name);
        expect(market.description).toEqual(marketCreate.description);
        expect(market.userId).toEqual(user.id);
      });
    });
  });

  describe('마켓 정보 수정', () => {
    let market: Market;
    let marketCacheKey: string;
    beforeAll(async () => {
      market = await marketRepository.save({
        name: '루비 마켓',
        description: '루비의 상점입니다.',
        userId: user.id,
      });

      marketCacheKey = `market_${market.id}`;
      await cacheManager.set(marketCacheKey, market);
    });

    afterAll(async () => {
      await marketRepository.delete({});
    });

    describe('요청 실패', () => {
      test('인증되지 않은 사용자의 마켓 정보 수정 요청시 401 응답', async () => {
        await request(app.getHttpServer())
          .put(`/api/markets/${market.id}`)
          .send({
            name: '루비 마트',
            description: '루비의 마트입니다.',
          })
          .expect(HttpStatus.UNAUTHORIZED);

        const cacheMarket = await cacheManager.get(marketCacheKey);
        expect(cacheMarket).toBeTruthy();
      });

      test('마켓 정보 수정시 필요한 값들이 형식에 맞지 않을 경우 400 응답', async () => {
        const res = await request(app.getHttpServer())
          .put(`/api/markets/${market.id}`)
          .send({
            name: '',
            description: '루비의 마트입니다.',
          })
          .set('Cookie', [`Authentication=${token}`])
          .expect(HttpStatus.BAD_REQUEST);

        const errorMessages = res.body.message;
        const cacheMarket = await cacheManager.get(marketCacheKey);
        expect(errorMessages).toContain(MarketErrorMessage.NAME_LENGTH);
        expect(cacheMarket).toBeTruthy();
      });

      test('등록되지 않은 마켓 정보 수정 요청시 404 응답', async () => {
        const res = await request(app.getHttpServer())
          .put(`/api/markets/${market.id + 999}`)
          .send({
            name: '루비 마트',
            description: '루비의 마트입니다.',
          })
          .set('Cookie', [`Authentication=${token}`])
          .expect(HttpStatus.NOT_FOUND);

        const errorMessage = res.body.message;
        const cacheMarket = await cacheManager.get(marketCacheKey);
        expect(errorMessage).toEqual(MarketNotFoundException.ERROR_MESSAGE);
        expect(cacheMarket).toBeTruthy();
      });
    });

    describe('요청 성공', () => {
      test('마켓 정보 수정 성공시 200 응답', async () => {
        const marketUpdate = {
          name: '루비 마트',
          description: '루비의 마트입니다.',
        };

        await request(app.getHttpServer())
          .put(`/api/markets/${market.id}`)
          .send(marketUpdate)
          .set('Cookie', [`Authentication=${token}`])
          .expect(HttpStatus.OK);

        const updatedMarket = (await marketRepository.findBy({}))[0];
        const cacheMarket = await cacheManager.get(marketCacheKey);
        expect(updatedMarket.id).toEqual(market.id);
        expect(updatedMarket.name).toEqual(marketUpdate.name);
        expect(updatedMarket.description).toEqual(marketUpdate.description);
        expect(cacheMarket).toBeNull();
      });
    });
  });

  describe('마켓 정보 삭제', () => {
    let market: Market;
    let marketCacheKey: string;
    beforeAll(async () => {
      market = await marketRepository.save({
        name: '루비 마켓',
        description: '루비의 상점입니다.',
        userId: user.id,
      });

      marketCacheKey = `market_${market.id}`;
      await cacheManager.set(marketCacheKey, market);
    });

    afterAll(async () => {
      await marketRepository.delete({});
    });

    describe('요청 실패', () => {
      test('인증되지 않은 사용자의 마켓 정보 삭제 요청시 401 응답', async () => {
        await request(app.getHttpServer())
          .delete(`/api/markets/${market.id}`)
          .expect(HttpStatus.UNAUTHORIZED);

        const cacheMarket = await cacheManager.get(marketCacheKey);
        expect(cacheMarket).toBeTruthy();
      });

      test('등록되지 않은 마켓 정보 삭제 요청시 404 응답', async () => {
        const res = await request(app.getHttpServer())
          .delete(`/api/markets/${market.id + 999}`)
          .set('Cookie', [`Authentication=${token}`])
          .expect(HttpStatus.NOT_FOUND);

        const errorMessage = res.body.message;
        const cacheMarket = await cacheManager.get(marketCacheKey);
        expect(errorMessage).toEqual(MarketNotFoundException.ERROR_MESSAGE);
        expect(cacheMarket).toBeTruthy();
      });
    });
    describe('요청 성공', () => {
      test('마켓 정보 삭제 성공시 200 응답', async () => {
        await request(app.getHttpServer())
          .delete(`/api/markets/${market.id}`)
          .set('Cookie', [`Authentication=${token}`])
          .expect(HttpStatus.OK);

        const marketCount = await marketRepository.count();
        const cacheMarket = await cacheManager.get(marketCacheKey);
        expect(marketCount).toEqual(0);
        expect(cacheMarket).toBeNull();
      });
    });
  });
});

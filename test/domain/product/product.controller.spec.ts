import {
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
import { ProductModule } from '../../../src/domain/product/product.module';
import { ProductRepository } from '../../../src/domain/product/product.repository';
import { Product } from '../../../src/domain/product/product.entity';
import { ProductErrorMessage } from '../../../src/domain/product/product.message';
import { ProductNotFoundException } from '../../../src/domain/product/product.exception';

describe('ProductController (e2e)', () => {
  let app: INestApplication;
  let marketRepository: MarketRepository;
  let productRepository: ProductRepository;
  let user: User;
  let market: Market;
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
        CustomTypeOrmModule.forCustomRepository([
          UserRepository,
          MarketRepository,
          ProductRepository,
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

    const userRepository = module.get<UserRepository>(UserRepository);
    marketRepository = module.get<MarketRepository>(MarketRepository);
    productRepository = module.get<ProductRepository>(ProductRepository);
    const jwtService = module.get<JwtService>(JwtService);

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

    token = await jwtService.sign({ ...user } as Payload);
  });

  describe('상품 정보 등록', () => {
    afterAll(async () => {
      await productRepository.delete({});
    });

    describe('요청 실패', () => {
      test('인증되지 않은 사용자의 마켓 정보 등록시 401 응답', async () => {
        await request(app.getHttpServer())
          .post('/api/products')
          .send({
            name: '루비',
            price: 10000000,
            stock: 10,
            description: '보석',
            marketId: market.id,
          })
          .expect(HttpStatus.UNAUTHORIZED);
      });

      test('상품 정보 등록시 필요한 값들이 형식에 맞지 않을 경우 400 응답', async () => {
        const res = await request(app.getHttpServer())
          .post('/api/products')
          .send({
            name: '',
            price: -10,
            stock: -1,
            description: '보석',
            marketId: 0,
          })
          .set('Cookie', [`Authentication=${token}`])
          .expect(HttpStatus.BAD_REQUEST);

        const errorMessages = res.body.message;
        expect(errorMessages).toContain(ProductErrorMessage.NAME_LENGTH);
        expect(errorMessages).toContain(ProductErrorMessage.PRICE_POSITIVE);
        expect(errorMessages).toContain(ProductErrorMessage.STOCK_POSITIVE);
        expect(errorMessages).toContain(MarketErrorMessage.ID_POSITIVE);
      });

      test('존재하지 않는 마켓에 상품 정보 등록시 404 응답', async () => {
        const res = await request(app.getHttpServer())
          .post('/api/products')
          .send({
            name: '루비',
            price: 10000000,
            stock: 10,
            description: '보석',
            marketId: market.id + 999,
          })
          .set('Cookie', [`Authentication=${token}`])
          .expect(HttpStatus.NOT_FOUND);

        const errorMessage = res.body.message;
        expect(errorMessage).toEqual(MarketNotFoundException.ERROR_MESSAGE);
      });
    });

    describe('요청 성공', () => {
      test('상품 정보 등록 성공시 201 응답', async () => {
        const productCreate = {
          name: '루비',
          price: 10000000,
          stock: 10,
          description: '보석',
          marketId: market.id,
        };

        await request(app.getHttpServer())
          .post('/api/products')
          .send(productCreate)
          .set('Cookie', [`Authentication=${token}`])
          .expect(HttpStatus.CREATED);

        const product = (await productRepository.findBy({}))[0];
        expect(product.name).toEqual(productCreate.name);
        expect(product.price).toEqual(productCreate.price);
        expect(product.stock).toEqual(productCreate.stock);
        expect(product.description).toEqual(productCreate.description);
        expect(product.marketId).toEqual(productCreate.marketId);
      });
    });
  });

  describe('상품 정보 수정', () => {
    let product: Product;
    beforeAll(async () => {
      product = await productRepository.save({
        name: '루비',
        price: 10000000,
        stock: 10,
        description: '보석',
        marketId: market.id,
      });
    });

    afterAll(async () => {
      await productRepository.delete({});
    });

    describe('요청 실패', () => {
      test('인증되지 않은 사용자의 마켓 정보 등록시 401 응답', async () => {
        await request(app.getHttpServer())
          .put(`/api/products/${product.id}`)
          .send({
            name: '고급 루비',
            price: 100000000,
            stock: 5,
            description: '고급 보석',
            marketId: market.id,
          })
          .expect(HttpStatus.UNAUTHORIZED);
      });

      test('상품 수정시 필요한 값들이 형식에 맞지 않을 경우 400 응답', async () => {
        const res = await request(app.getHttpServer())
          .put(`/api/products/${product.id}`)
          .send({
            name: '',
            price: -10,
            stock: -1,
            description: '고급 보석',
            marketId: -1,
          })
          .set('Cookie', [`Authentication=${token}`])
          .expect(HttpStatus.BAD_REQUEST);

        const errorMessages = res.body.message;
        expect(errorMessages).toContain(ProductErrorMessage.NAME_LENGTH);
        expect(errorMessages).toContain(ProductErrorMessage.PRICE_POSITIVE);
        expect(errorMessages).toContain(ProductErrorMessage.STOCK_POSITIVE);
        expect(errorMessages).toContain(MarketErrorMessage.ID_POSITIVE);
      });

      test('마켓 id가 상품에 등록된 마켓 id 와 일치하지 않을 경우 404 응답', async () => {
        const res = await request(app.getHttpServer())
          .put(`/api/products/${product.id}`)
          .send({
            name: '고급 루비',
            price: 100000000,
            stock: 5,
            description: '고급 보석',
            marketId: market.id + 999,
          })
          .set('Cookie', [`Authentication=${token}`])
          .expect(HttpStatus.NOT_FOUND);

        const errorMessages = res.body.message;
        expect(errorMessages).toEqual(MarketNotFoundException.ERROR_MESSAGE);
      });

      test('상품 id가 일치하지 않을 경우 404 응답', async () => {
        const res = await request(app.getHttpServer())
          .put(`/api/products/${product.id + 999}`)
          .send({
            name: '고급 루비',
            price: 100000000,
            stock: 5,
            description: '고급 보석',
            marketId: market.id,
          })
          .set('Cookie', [`Authentication=${token}`])
          .expect(HttpStatus.NOT_FOUND);

        const errorMessages = res.body.message;
        expect(errorMessages).toEqual(ProductNotFoundException.ERROR_MESSAGE);
      });
    });

    describe('요청 성공', () => {
      test('상품 정보 수정 성공', async () => {
        const productDto = {
          name: '고급 루비',
          price: 100000000,
          stock: 5,
          description: '고급 보석',
          marketId: market.id,
        };

        await request(app.getHttpServer())
          .put(`/api/products/${product.id}`)
          .send(productDto)
          .set('Cookie', [`Authentication=${token}`])
          .expect(HttpStatus.OK);

        const updatedProduct = await productRepository.findOneBy({
          id: product.id,
        });

        expect(updatedProduct.id).toEqual(product.id);
        expect(updatedProduct.name).toEqual(productDto.name);
        expect(updatedProduct.price).toEqual(productDto.price);
        expect(updatedProduct.stock).toEqual(productDto.stock);
        expect(updatedProduct.description).toEqual(productDto.description);
      });
    });
  });

  describe('상품 정보 삭제', () => {
    let product: Product;
    beforeAll(async () => {
      product = await productRepository.save({
        name: '루비',
        price: 10000000,
        stock: 10,
        description: '보석',
        marketId: market.id,
      });
    });

    afterAll(async () => {
      await productRepository.delete({});
    });

    describe('요청 실패', () => {
      test('인증되지 않은 사용자의 마켓 정보 등록시 401 응답', async () => {
        await request(app.getHttpServer())
          .delete(`/api/products/${product.id}`)
          .send({
            marketId: market.id,
          })
          .expect(HttpStatus.UNAUTHORIZED);
      });

      test('상품 정보 삭제시 필요한 값들이 형식에 맞지 않을 경우 400 응답', async () => {
        const res = await request(app.getHttpServer())
          .delete(`/api/products/${product.id}`)
          .send({
            marketId: -1,
          })
          .set('Cookie', [`Authentication=${token}`])
          .expect(HttpStatus.BAD_REQUEST);

        const errorMessages = res.body.message;
        expect(errorMessages).toContain(MarketErrorMessage.ID_POSITIVE);
      });

      test('마켓 id가 상품에 등록된 마켓 id 와 일치하지 않을 경우 404 응답', async () => {
        const res = await request(app.getHttpServer())
          .delete(`/api/products/${product.id}`)
          .send({
            marketId: market.id + 999,
          })
          .set('Cookie', [`Authentication=${token}`])
          .expect(HttpStatus.NOT_FOUND);

        const errorMessage = res.body.message;
        expect(errorMessage).toContain(MarketNotFoundException.ERROR_MESSAGE);
      });

      test('상품 id가 일치하지 않을 경우 404 응답', async () => {
        const res = await request(app.getHttpServer())
          .delete(`/api/products/${product.id + 999}`)
          .send({
            marketId: market.id,
          })
          .set('Cookie', [`Authentication=${token}`])
          .expect(HttpStatus.NOT_FOUND);

        const errorMessage = res.body.message;
        expect(errorMessage).toContain(ProductNotFoundException.ERROR_MESSAGE);
      });
    });

    describe('요청 성공', () => {
      test('상품 정보 삭제 성공', async () => {
        await request(app.getHttpServer())
          .delete(`/api/products/${product.id}`)
          .send({
            marketId: market.id,
          })
          .set('Cookie', [`Authentication=${token}`])
          .expect(HttpStatus.OK);

        const count = await productRepository.count();
        expect(count).toEqual(0);
      });
    });
  });
});

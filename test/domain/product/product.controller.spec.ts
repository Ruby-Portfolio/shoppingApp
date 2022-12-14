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
import { ProductModule } from '../../../src/domain/product/product.module';
import { ProductRepository } from '../../../src/domain/product/product.repository';
import { Product } from '../../../src/domain/product/product.entity';
import { ProductErrorMessage } from '../../../src/domain/product/product.message';
import { ProductNotFoundException } from '../../../src/domain/product/product.exception';
import { Cache } from 'cache-manager';

describe('ProductController (e2e)', () => {
  let app: INestApplication;
  let userRepository: UserRepository;
  let marketRepository: MarketRepository;
  let productRepository: ProductRepository;
  let cacheManager: Cache;
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

    userRepository = module.get<UserRepository>(UserRepository);
    marketRepository = module.get<MarketRepository>(MarketRepository);
    productRepository = module.get<ProductRepository>(ProductRepository);
    cacheManager = module.get(CACHE_MANAGER);
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
      name: '?????? ??????',
      description: '????????? ???????????????.',
      userId: user.id,
    });

    token = await jwtService.sign({ ...user } as Payload);
  });

  afterAll(async () => {
    await productRepository.delete({});
    await marketRepository.delete({});
    await userRepository.delete({});
  });

  describe('?????? ?????? ??????', () => {
    let productsCacheKey;
    let productsCache;
    beforeAll(async () => {
      productsCacheKey = 'products_cache_0';
      productsCache = { data: 'data' };
      await cacheManager.set('products_cache_0', productsCache);
    });

    afterAll(async () => {
      await productRepository.delete({});
      await cacheManager.reset();
    });

    describe('?????? ??????', () => {
      test('???????????? ?????? ???????????? ?????? ?????? ????????? 401 ??????', async () => {
        await request(app.getHttpServer())
          .post('/api/products')
          .send({
            name: '??????',
            price: 10000000,
            description: '??????',
            marketId: market.id,
          })
          .expect(HttpStatus.UNAUTHORIZED);

        const cacheData = await cacheManager.get(productsCacheKey);
        expect(cacheData).toEqual(productsCache);
      });

      test('?????? ?????? ????????? ????????? ????????? ????????? ?????? ?????? ?????? 400 ??????', async () => {
        const res = await request(app.getHttpServer())
          .post('/api/products')
          .send({
            name: '',
            price: -10,
            description: '??????',
            marketId: 0,
          })
          .set('Cookie', [`Authentication=${token}`])
          .expect(HttpStatus.BAD_REQUEST);

        const errorMessages = res.body.message;
        expect(errorMessages).toContain(ProductErrorMessage.NAME_LENGTH);
        expect(errorMessages).toContain(ProductErrorMessage.PRICE_POSITIVE);
        expect(errorMessages).toContain(MarketErrorMessage.ID_POSITIVE);

        const cacheData = await cacheManager.get(productsCacheKey);
        expect(cacheData).toEqual(productsCache);
      });

      test('???????????? ?????? ????????? ?????? ?????? ????????? 404 ??????', async () => {
        const res = await request(app.getHttpServer())
          .post('/api/products')
          .send({
            name: '??????',
            price: 10000000,
            description: '??????',
            marketId: market.id + 999,
          })
          .set('Cookie', [`Authentication=${token}`])
          .expect(HttpStatus.NOT_FOUND);

        const errorMessage = res.body.message;
        expect(errorMessage).toEqual(MarketNotFoundException.ERROR_MESSAGE);

        const cacheData = await cacheManager.get(productsCacheKey);
        expect(cacheData).toEqual(productsCache);
      });
    });

    describe('?????? ??????', () => {
      test('?????? ?????? ?????? ????????? 201 ??????', async () => {
        const productCreate = {
          name: '??????',
          price: 10000000,
          description: '??????',
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
        expect(product.description).toEqual(productCreate.description);
        expect(product.marketId).toEqual(productCreate.marketId);

        const cacheData = await cacheManager.get(productsCacheKey);
        expect(cacheData).toBeNull();
      });
    });
  });

  describe('?????? ?????? ??????', () => {
    let product: Product;
    let productCacheKey;
    let productsCacheKey;
    let productsCache;
    beforeAll(async () => {
      product = await productRepository.save({
        name: '??????',
        price: 10000000,
        description: '??????',
        marketId: market.id,
      });
      productCacheKey = `productDetail_${product.id}`;
      await cacheManager.set(productCacheKey, product);

      productsCacheKey = 'products_cache_0';
      productsCache = { data: 'data' };
      await cacheManager.set(productsCacheKey, productsCache);
    });

    afterAll(async () => {
      await productRepository.delete({});
      await cacheManager.reset();
    });

    describe('?????? ??????', () => {
      test('???????????? ?????? ???????????? ?????? ?????? ????????? 401 ??????', async () => {
        await request(app.getHttpServer())
          .put(`/api/products/${product.id}`)
          .send({
            name: '?????? ??????',
            price: 100000000,
            description: '?????? ??????',
            marketId: market.id,
          })
          .expect(HttpStatus.UNAUTHORIZED);

        const findProductCache = await cacheManager.get(productCacheKey);
        const findProductsCache = await cacheManager.get(productsCacheKey);
        expect(findProductCache['id']).toEqual(product.id);
        expect(findProductsCache).toEqual(productsCache);
      });

      test('?????? ????????? ????????? ????????? ????????? ?????? ?????? ?????? 400 ??????', async () => {
        const res = await request(app.getHttpServer())
          .put(`/api/products/${product.id}`)
          .send({
            name: '',
            price: -10,
            description: '?????? ??????',
            marketId: -1,
          })
          .set('Cookie', [`Authentication=${token}`])
          .expect(HttpStatus.BAD_REQUEST);

        const errorMessages = res.body.message;
        expect(errorMessages).toContain(ProductErrorMessage.NAME_LENGTH);
        expect(errorMessages).toContain(ProductErrorMessage.PRICE_POSITIVE);
        expect(errorMessages).toContain(MarketErrorMessage.ID_POSITIVE);

        const findProductCache = await cacheManager.get(productCacheKey);
        const findProductsCache = await cacheManager.get(productsCacheKey);
        expect(findProductCache['id']).toEqual(product.id);
        expect(findProductsCache).toEqual(productsCache);
      });

      test('?????? id??? ????????? ????????? ?????? id ??? ???????????? ?????? ?????? 404 ??????', async () => {
        const res = await request(app.getHttpServer())
          .put(`/api/products/${product.id}`)
          .send({
            name: '?????? ??????',
            price: 100000000,
            description: '?????? ??????',
            marketId: market.id + 999,
          })
          .set('Cookie', [`Authentication=${token}`])
          .expect(HttpStatus.NOT_FOUND);

        const errorMessages = res.body.message;
        expect(errorMessages).toEqual(MarketNotFoundException.ERROR_MESSAGE);

        const findProductCache = await cacheManager.get(productCacheKey);
        const findProductsCache = await cacheManager.get(productsCacheKey);
        expect(findProductCache['id']).toEqual(product.id);
        expect(findProductsCache).toEqual(productsCache);
      });

      test('?????? id??? ???????????? ?????? ?????? 404 ??????', async () => {
        const res = await request(app.getHttpServer())
          .put(`/api/products/${product.id + 999}`)
          .send({
            name: '?????? ??????',
            price: 100000000,
            description: '?????? ??????',
            marketId: market.id,
          })
          .set('Cookie', [`Authentication=${token}`])
          .expect(HttpStatus.NOT_FOUND);

        const errorMessages = res.body.message;
        expect(errorMessages).toEqual(ProductNotFoundException.ERROR_MESSAGE);

        const findProductCache = await cacheManager.get(productCacheKey);
        const findProductsCache = await cacheManager.get(productsCacheKey);
        expect(findProductCache['id']).toEqual(product.id);
        expect(findProductsCache).toEqual(productsCache);
      });
    });

    describe('?????? ??????', () => {
      test('?????? ?????? ?????? ??????', async () => {
        const productDto = {
          name: '?????? ??????',
          price: 100000000,
          description: '?????? ??????',
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
        expect(updatedProduct.description).toEqual(productDto.description);

        const findProductCache = await cacheManager.get(productCacheKey);
        const findProductsCache = await cacheManager.get(productsCacheKey);
        expect(findProductCache).toBeNull();
        expect(findProductsCache).toBeNull();
      });
    });
  });

  describe('?????? ?????? ??????', () => {
    let product: Product;
    let productCacheKey;
    let productsCacheKey;
    let productsCache;
    beforeAll(async () => {
      product = await productRepository.save({
        name: '??????',
        price: 10000000,
        description: '??????',
        marketId: market.id,
      });

      productCacheKey = `productDetail_${product.id}`;
      await cacheManager.set(productCacheKey, product);

      productsCacheKey = 'products_cache_0';
      productsCache = { data: 'data' };
      await cacheManager.set(productsCacheKey, productsCache);
    });

    afterAll(async () => {
      await productRepository.delete({});
      await cacheManager.reset();
    });

    describe('?????? ??????', () => {
      test('???????????? ?????? ???????????? ?????? ?????? ?????? ????????? 401 ??????', async () => {
        await request(app.getHttpServer())
          .delete(`/api/products/${product.id}`)
          .send({
            marketId: market.id,
          })
          .expect(HttpStatus.UNAUTHORIZED);

        const findProductCache = await cacheManager.get(productCacheKey);
        const findProductsCache = await cacheManager.get(productsCacheKey);
        expect(findProductCache['id']).toEqual(product.id);
        expect(findProductsCache).toEqual(productsCache);
      });

      test('?????? ?????? ????????? ????????? ????????? ????????? ?????? ?????? ?????? 400 ??????', async () => {
        const res = await request(app.getHttpServer())
          .delete(`/api/products/${product.id}`)
          .send({
            marketId: -1,
          })
          .set('Cookie', [`Authentication=${token}`])
          .expect(HttpStatus.BAD_REQUEST);

        const errorMessages = res.body.message;
        expect(errorMessages).toContain(MarketErrorMessage.ID_POSITIVE);

        const findProductCache = await cacheManager.get(productCacheKey);
        const findProductsCache = await cacheManager.get(productsCacheKey);
        expect(findProductCache['id']).toEqual(product.id);
        expect(findProductsCache).toEqual(productsCache);
      });

      test('?????? id??? ????????? ????????? ?????? id ??? ???????????? ?????? ?????? 404 ??????', async () => {
        const res = await request(app.getHttpServer())
          .delete(`/api/products/${product.id}`)
          .send({
            marketId: market.id + 999,
          })
          .set('Cookie', [`Authentication=${token}`])
          .expect(HttpStatus.NOT_FOUND);

        const errorMessage = res.body.message;
        expect(errorMessage).toContain(MarketNotFoundException.ERROR_MESSAGE);

        const findProductCache = await cacheManager.get(productCacheKey);
        const findProductsCache = await cacheManager.get(productsCacheKey);
        expect(findProductCache['id']).toEqual(product.id);
        expect(findProductsCache).toEqual(productsCache);
      });

      test('?????? id??? ???????????? ?????? ?????? 404 ??????', async () => {
        const res = await request(app.getHttpServer())
          .delete(`/api/products/${product.id + 999}`)
          .send({
            marketId: market.id,
          })
          .set('Cookie', [`Authentication=${token}`])
          .expect(HttpStatus.NOT_FOUND);

        const errorMessage = res.body.message;
        expect(errorMessage).toContain(ProductNotFoundException.ERROR_MESSAGE);

        const findProductCache = await cacheManager.get(productCacheKey);
        const findProductsCache = await cacheManager.get(productsCacheKey);
        expect(findProductCache['id']).toEqual(product.id);
        expect(findProductsCache).toEqual(productsCache);
      });
    });

    describe('?????? ??????', () => {
      test('?????? ?????? ?????? ??????', async () => {
        await request(app.getHttpServer())
          .delete(`/api/products/${product.id}`)
          .send({
            marketId: market.id,
          })
          .set('Cookie', [`Authentication=${token}`])
          .expect(HttpStatus.OK);

        const count = await productRepository.count();
        expect(count).toEqual(0);

        const findProductCache = await cacheManager.get(productCacheKey);
        const findProductsCache = await cacheManager.get(productsCacheKey);
        expect(findProductCache).toBeNull();
        expect(findProductsCache).toBeNull();
      });
    });
  });

  describe('?????? ?????? ?????? ??????', () => {
    let product: Product;
    beforeAll(async () => {
      product = await productRepository.save({
        name: '??????',
        price: 10000000,
        description: '??????',
        marketId: market.id,
      });
    });

    afterAll(async () => {
      await productRepository.delete({});
    });

    describe('?????? ??????', () => {
      test('???????????? ?????? ?????? ?????? ?????? ?????? ????????? 404 ??????', async () => {
        await request(app.getHttpServer())
          .get(`/api/products/${product.id + 999}`)
          .expect(HttpStatus.NOT_FOUND);
      });
    });

    describe('?????? ??????', () => {
      test('?????? ?????? ?????? ??????', async () => {
        const res = await request(app.getHttpServer())
          .get(`/api/products/${product.id}`)
          .expect(HttpStatus.OK);

        const productDetail = res.body;

        expect(productDetail.id).toEqual(product.id);
        expect(productDetail.name).toEqual(product.name);
        expect(productDetail.price).toEqual(product.price);
        expect(productDetail.description).toEqual(product.description);
        expect(productDetail.marketName).toEqual(market.name);
        expect(productDetail.userName).toEqual(user.name);
      });
    });
  });

  describe('?????? ?????? ??????', () => {
    beforeAll(async () => {
      for (let i = 0; i < 35; i++) {
        await productRepository.save({
          name: i % 2 === 0 ? '??????' : '?????????',
          price: i % 2 === 0 ? 10000000 : 70000000,
          description: i % 2 === 0 ? '????????????' : '???????????????',
          marketId: market.id,
        });
      }
    });

    afterAll(async () => {
      await productRepository.delete({});
    });

    describe('?????? ??????', () => {
      test('????????? ????????? 0?????? ?????? ?????? 400 ??????', async () => {
        await request(app.getHttpServer())
          .get(`/api/products`)
          .query({
            page: -1,
          })
          .expect(HttpStatus.BAD_REQUEST);
      });
    });
    describe('?????? ??????', () => {
      test('?????? ?????? ????????? ???????????? ???????????? ?????? ??????', async () => {
        const res = await request(app.getHttpServer())
          .get(`/api/products`)
          .query({
            keyword: '???',
            page: 1,
          })
          .expect(HttpStatus.OK);

        const products = res.body.products;
        expect(products.length).toEqual(8);
        expect(
          products.every((product) => product.name === '??????'),
        ).toBeTruthy();
        expect(
          products.every((product) => product.price === 10000000),
        ).toBeTruthy();
      });

      test('?????? ?????? ????????? ?????? ????????? ???????????? ?????? ??????', async () => {
        const res = await request(app.getHttpServer())
          .get(`/api/products`)
          .query({
            keyword: '??????',
            page: 0,
          })
          .expect(HttpStatus.OK);

        const products = res.body.products;
        expect(products.length).toEqual(10);
        expect(
          products.every((product) => product.name === '?????????'),
        ).toBeTruthy();
        expect(
          products.every((product) => product.price === 70000000),
        ).toBeTruthy();
      });
    });
  });
});

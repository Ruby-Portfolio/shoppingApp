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
import { Market } from '../../../src/domain/market/market.entity';
import { JwtService } from '@nestjs/jwt';
import { Payload } from '../../../src/module/auth/jwt/jwt.payload';
import { ProductModule } from '../../../src/domain/product/product.module';
import { ProductRepository } from '../../../src/domain/product/product.repository';
import { Product } from '../../../src/domain/product/product.entity';
import { POrderRepository } from '../../../src/domain/pOrder/pOrder.repository';
import { OrderItemRepository } from '../../../src/domain/orderItem/orderItem.repository';
import * as request from 'supertest';
import * as redisStore from 'cache-manager-ioredis';
import { POrderModule } from '../../../src/domain/pOrder/pOrder.module';
import { POrder } from '../../../src/domain/pOrder/pOrder.entity';
import { OrderItem } from '../../../src/domain/orderItem/orderItem.entity';
import { OrderItemErrorMessage } from '../../../src/domain/orderItem/orderItem.message';
import { ProductNotFoundException } from '../../../src/domain/product/product.exception';
import { POrderState } from '../../../src/domain/pOrder/pOrder.enum';
import { POrderNotFoundException } from '../../../src/domain/pOrder/pOrder.exception';

describe('POrderController (e2e)', () => {
  let app: INestApplication;
  let userRepository: UserRepository;
  let marketRepository: MarketRepository;
  let productRepository: ProductRepository;
  let pOrderRepository: POrderRepository;
  let orderItemRepository: OrderItemRepository;
  let user: User;
  let market: Market;
  let savedProducts: Product[];
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
          entities: [User, Market, Product, POrder, OrderItem],
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
        POrderModule,
        CustomTypeOrmModule.forCustomRepository([
          UserRepository,
          MarketRepository,
          ProductRepository,
          POrderRepository,
          OrderItemRepository,
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
    pOrderRepository = module.get<POrderRepository>(POrderRepository);
    orderItemRepository = module.get<OrderItemRepository>(OrderItemRepository);
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

    savedProducts = await productRepository.save([
      { name: '?????????', price: 1000000, marketId: market.id },
      { name: '????????????', price: 2000000, marketId: market.id },
      { name: '????????????', price: 1500000, marketId: market.id },
    ]);

    token = await jwtService.sign({ ...user } as Payload);
  });

  afterAll(async () => {
    await orderItemRepository.delete({});
    await pOrderRepository.delete({});
    await productRepository.delete({});
    await marketRepository.delete({});
    await userRepository.delete({});
  });

  describe('?????? ??????', () => {
    afterAll(async () => {
      await orderItemRepository.delete({});
      await pOrderRepository.delete({});
    });

    describe('?????? ??????', () => {
      test('???????????? ?????? ???????????? ?????? ????????? 401 ??????', async () => {
        const orderCreateDto = {
          orderItems: [
            { productId: savedProducts[0].id, count: 1 },
            { productId: savedProducts[1].id, count: 2 },
            { productId: savedProducts[2].id, count: 3 },
          ],
        };

        await request(app.getHttpServer())
          .post('/api/orders')
          .send(orderCreateDto)
          .expect(HttpStatus.UNAUTHORIZED);
      });

      test('?????? ????????? ?????? ????????? ????????? ????????? ????????? ?????? ?????? ?????? 400 ??????', async () => {
        const orderCreateDto = {
          orderItems: [
            { productId: -1, count: -1 },
            { productId: 0, count: 0 },
            { productId: '?????????', count: '??????' },
          ],
        };

        const res = await request(app.getHttpServer())
          .post('/api/orders')
          .send(orderCreateDto)
          .set('Cookie', [`Authentication=${token}`])
          .expect(HttpStatus.BAD_REQUEST);

        console.log(res.body);

        const errorMessages = res.body.message;
        expect(errorMessages).toContain(
          OrderItemErrorMessage.ORDER_ITEM_INVALID,
        );
      });

      test('???????????? ?????? ???????????? ?????? ????????? 404 ??????', async () => {
        const orderCreateDto = {
          orderItems: [
            { productId: savedProducts[0].id + 999, count: 1 },
            { productId: savedProducts[1].id + 999, count: 2 },
            { productId: savedProducts[2].id + 999, count: 3 },
          ],
        };

        const res = await request(app.getHttpServer())
          .post('/api/orders')
          .send(orderCreateDto)
          .set('Cookie', [`Authentication=${token}`])
          .expect(HttpStatus.NOT_FOUND);

        const errorMessage = res.body.message;
        expect(errorMessage).toEqual(ProductNotFoundException.ERROR_MESSAGE);
      });
    });
    describe('?????? ??????', () => {
      test('?????? ?????? ????????? 201 ??????', async () => {
        const orderCreateDto = {
          orderItems: [
            { productId: savedProducts[0].id, count: 1 },
            { productId: savedProducts[1].id, count: 2 },
            { productId: savedProducts[2].id, count: 3 },
          ],
        };

        await request(app.getHttpServer())
          .post('/api/orders')
          .send(orderCreateDto)
          .set('Cookie', [`Authentication=${token}`])
          .expect(HttpStatus.CREATED);

        const order = (await pOrderRepository.findBy({}))[0];
        const orderItems = await orderItemRepository.findBy({});

        expect(orderItems.length).toEqual(3);
        expect(
          orderItems.every((orderItem) => orderItem.pOrderId === order.id),
        ).toBeTruthy();
        expect(orderItems[0].count).toEqual(1);
        expect(orderItems[1].count).toEqual(2);
        expect(orderItems[2].count).toEqual(3);
      });
    });
  });

  describe('?????? ??????', () => {
    let order: POrder;
    beforeAll(async () => {
      order = await pOrderRepository.save({
        userId: user.id,
        orderState: POrderState.PAYMENT_WAITING,
      });
      await orderItemRepository.save([
        {
          pOrderId: order.id,
          productId: savedProducts[0].id,
          count: 3,
        },
        {
          pOrderId: order.id,
          productId: savedProducts[1].id,
          count: 5,
        },
      ]);
    });

    afterAll(async () => {
      await orderItemRepository.delete({});
      await pOrderRepository.delete({});
    });

    describe('?????? ??????', () => {
      test('???????????? ?????? ???????????? ?????? ????????? 401 ??????', async () => {
        await request(app.getHttpServer())
          .delete(`/api/orders/${order.id}`)
          .expect(HttpStatus.UNAUTHORIZED);
      });

      test('???????????? ?????? ?????? ????????? 404 ??????', async () => {
        const res = await request(app.getHttpServer())
          .delete(`/api/orders/${order.id + 999}`)
          .set('Cookie', [`Authentication=${token}`])
          .expect(HttpStatus.NOT_FOUND);

        const errorMessage = res.body.message;
        expect(errorMessage).toEqual(POrderNotFoundException.ERROR_MESSAGE);
      });
    });

    describe('?????? ??????', () => {
      test('?????? ?????? ????????? 201 ??????', async () => {
        await request(app.getHttpServer())
          .delete(`/api/orders/${order.id}`)
          .set('Cookie', [`Authentication=${token}`])
          .expect(HttpStatus.OK);

        const orderCount = await pOrderRepository.count();
        const orderItemCount = await orderItemRepository.count();

        expect(orderCount).toEqual(0);
        expect(orderItemCount).toEqual(0);
      });
    });
  });

  describe('????????? ?????? ?????? ??????', () => {
    let order: POrder;
    let orderItems: OrderItem[];
    beforeAll(async () => {
      order = await pOrderRepository.save({
        userId: user.id,
        orderState: POrderState.PAYMENT_WAITING,
      });
      orderItems = await orderItemRepository.save([
        {
          pOrderId: order.id,
          productId: savedProducts[0].id,
          count: 3,
        },
        {
          pOrderId: order.id,
          productId: savedProducts[1].id,
          count: 5,
        },
      ]);
    });

    afterAll(async () => {
      await orderItemRepository.delete({});
      await pOrderRepository.delete({});
    });

    describe('?????? ??????', () => {
      test('???????????? ?????? ???????????? ?????? ?????? ????????? 401 ??????', async () => {
        await request(app.getHttpServer())
          .get('/api/orders')
          .expect(HttpStatus.UNAUTHORIZED);
      });
    });
    describe('?????? ??????', () => {
      test('?????? ?????? ?????? ????????? 201 ??????', async () => {
        const res = await request(app.getHttpServer())
          .get('/api/orders')
          .set('Cookie', [`Authentication=${token}`])
          .expect(HttpStatus.OK);

        const { orders } = res.body;
        const totalPrice =
          orderItems[0].count * savedProducts[0].price +
          orderItems[1].count * savedProducts[1].price;

        expect(orders[0].orderId).toEqual(order.id);
        expect(orders[0].totalPrice).toEqual(totalPrice);
      });
    });
  });
});

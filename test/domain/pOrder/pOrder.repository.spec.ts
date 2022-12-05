import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { MarketRepository } from '../../../src/domain/market/market.repository';
import { Market } from '../../../src/domain/market/market.entity';
import { ProductRepository } from '../../../src/domain/product/product.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../../src/domain/user/user.entity';
import { Product } from '../../../src/domain/product/product.entity';
import { CustomTypeOrmModule } from '../../../src/module/typeorm/typeorm.module';
import { UserRepository } from '../../../src/domain/user/user.repository';
import { POrder } from '../../../src/domain/pOrder/pOrder.entity';
import { OrderItem } from '../../../src/domain/orderItem/orderItem.entity';
import { POrderRepository } from '../../../src/domain/pOrder/pOrder.repository';
import { OrderItemRepository } from '../../../src/domain/orderItem/orderItem.repository';
import { POrderState } from '../../../src/domain/pOrder/pOrder.enum';
import { OrdersDto } from '../../../src/domain/pOrder/pOrder.dto';

describe('POrderRepository', () => {
  let userRepository: UserRepository;
  let marketRepository: MarketRepository;
  let productRepository: ProductRepository;
  let pOrderRepository: POrderRepository;
  let orderItemRepository: OrderItemRepository;
  let user: User;
  let market: Market;
  let savedProducts: Product[];

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
        CustomTypeOrmModule.forCustomRepository([
          UserRepository,
          MarketRepository,
          ProductRepository,
          POrderRepository,
          OrderItemRepository,
        ]),
      ],
      providers: [
        UserRepository,
        MarketRepository,
        ProductRepository,
        POrderRepository,
        OrderItemRepository,
      ],
    }).compile();

    userRepository = module.get<UserRepository>(UserRepository);
    marketRepository = module.get<MarketRepository>(MarketRepository);
    productRepository = module.get<ProductRepository>(ProductRepository);
    pOrderRepository = module.get<POrderRepository>(POrderRepository);
    orderItemRepository = module.get<OrderItemRepository>(OrderItemRepository);

    await orderItemRepository.delete({});
    await pOrderRepository.delete({});
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

    savedProducts = await productRepository.save([
      { name: '플루트', price: 1000000, marketId: market.id },
      { name: '바이올린', price: 2000000, marketId: market.id },
      { name: '클라리넷', price: 1500000, marketId: market.id },
    ]);
  });

  afterAll(async () => {
    await orderItemRepository.delete({});
    await pOrderRepository.delete({});
  });

  describe('getOrdersByUser - 유저의 주문 목록 조회', () => {
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

    test('유저의 주문 목록 조회', async () => {
      const ordersDto: OrdersDto = await pOrderRepository.getOrdersByUser(
        user.id,
      );
      const totalPrice =
        orderItems[0].count * savedProducts[0].price +
        orderItems[1].count * savedProducts[1].price;

      expect(ordersDto.orders[0].orderId).toEqual(order.id);
      expect(ordersDto.orders[0].totalPrice).toEqual(totalPrice);
    });
  });
});

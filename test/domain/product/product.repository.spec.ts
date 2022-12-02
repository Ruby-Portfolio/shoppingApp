import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { MarketRepository } from '../../../src/domain/market/market.repository';
import { Market } from '../../../src/domain/market/market.entity';
import { ProductRepository } from '../../../src/domain/product/product.repository';
import { UserRepository } from '../../../src/domain/user/user.repository';
import { User } from '../../../src/domain/user/user.entity';
import { Product } from '../../../src/domain/product/product.entity';
import { CustomTypeOrmModule } from '../../../src/module/typeorm/typeorm.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductDto } from '../../../src/domain/product/product.dto';

describe('ProductRepository', () => {
  let productRepository: ProductRepository;
  let marketRepository: MarketRepository;
  let userRepository: UserRepository;
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
          entities: [User, Market, Product],
          charset: 'utf8mb4',
          synchronize: true,
          logging: true,
        }),
        CustomTypeOrmModule.forCustomRepository([
          UserRepository,
          MarketRepository,
          ProductRepository,
        ]),
      ],
    }).compile();

    productRepository = module.get<ProductRepository>(ProductRepository);
    marketRepository = module.get<MarketRepository>(MarketRepository);
    userRepository = module.get<UserRepository>(UserRepository);
    await productRepository.delete({});
    await marketRepository.delete({});
    await userRepository.delete({});

    user = await userRepository.save({
      provider: '123',
      providerId: '123',
      name: 'ruby',
      email: 'ruby@gmail.com',
    });
    market = await marketRepository.save({
      name: '루비 상점',
      description: '루비의 상점입니다.',
      userId: user.id,
    });
  });

  describe('updateProduct - 상품 정보 수정', () => {
    let product: Product;
    beforeAll(async () => {
      product = await productRepository.save({
        name: '플루트',
        price: 10000000,
        stock: 10,
        description: '관악기',
        marketId: market.id,
      });
    });
    describe('수정 실패', () => {
      test('마켓 id가 일치하지 않을 경우', async () => {
        const productDto: ProductDto = {
          name: '클라리넷',
          price: 50000,
          stock: 20,
          description: '악기',
          marketId: market.id + 999,
        };

        const updateResult: boolean = await productRepository.updateProduct(
          product.id,
          productDto,
        );

        expect(updateResult).toBeFalsy();
      });
    });
    describe('수정 성공', () => {
      test('상품 정보 수정', async () => {
        const productDto: ProductDto = {
          name: '클라리넷',
          price: 50000,
          stock: 20,
          description: '악기',
          marketId: market.id,
        };

        const updateResult: boolean = await productRepository.updateProduct(
          product.id,
          productDto,
        );

        const updatedProduct = await productRepository.findOneBy({
          id: product.id,
        });

        expect(updateResult).toBeTruthy();
        expect(updatedProduct.id).toEqual(product.id);
        expect(updatedProduct.name).toEqual(productDto.name);
        expect(updatedProduct.price).toEqual(productDto.price);
        expect(updatedProduct.stock).toEqual(productDto.stock);
        expect(updatedProduct.description).toEqual(productDto.description);
        expect(updatedProduct.marketId).toEqual(market.id);
      });
    });
  });
});

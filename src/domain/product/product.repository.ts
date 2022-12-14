import { Repository } from 'typeorm';
import { CustomRepository } from '../../module/typeorm/typeorm.decorator';
import { Product } from './product.entity';
import { ProductDetailDto, ProductsDto, ProductsSearch } from './product.dto';
import { Market } from '../market/market.entity';
import { User } from '../user/user.entity';

@CustomRepository(Product)
export class ProductRepository extends Repository<Product> {
  async getProductDetail(productId: number): Promise<ProductDetailDto> {
    return this.createQueryBuilder('product')
      .leftJoinAndSelect(Market, 'market', 'market.id = product.marketId')
      .leftJoinAndSelect(User, 'user', 'user.id = market.userId')
      .select([
        'product.id as id',
        'product.name as name',
        'product.price as price',
        'product.description as description',
        'market.name as marketName',
        'user.name as userName',
      ])
      .where({ id: productId })
      .getRawOne();
  }

  async getProducts(productsSearch: ProductsSearch): Promise<ProductsDto> {
    const take = 10;
    const skip = 10 * productsSearch.page;

    const products = await this.createQueryBuilder('product')
      .select([
        'product.id as id',
        'product.name as name',
        'product.price as price',
      ])
      .where('product.name LIKE :keyword', {
        keyword: `%${productsSearch.keyword}%`,
      })
      .orWhere('product.description LIKE :keyword', {
        keyword: `%${productsSearch.keyword}%`,
      })
      .take(take)
      .skip(skip)
      .orderBy('product.id', 'DESC')
      .getRawMany();

    return { products };
  }

  async getProductIdsByMarket(marketId: number): Promise<number[]> {
    return this.createQueryBuilder('product')
      .select(['product.id as productId'])
      .where({ marketId })
      .getRawMany();
  }
}

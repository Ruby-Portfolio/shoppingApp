import { Repository } from 'typeorm';
import { CustomRepository } from '../../module/typeorm/typeorm.decorator';
import { Product } from './product.entity';
import { ProductDetailDto } from './product.dto';
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
        'product.stock as stock',
        'product.description as description',
        'market.name as marketName',
        'user.name as userName',
      ])
      .where({ id: productId })
      .getRawOne();
  }
}

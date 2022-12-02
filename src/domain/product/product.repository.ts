import { Repository } from 'typeorm';
import { CustomRepository } from '../../module/typeorm/typeorm.decorator';
import { Product } from './product.entity';
import { ProductDto } from './product.dto';

@CustomRepository(Product)
export class ProductRepository extends Repository<Product> {
  async updateProduct(
    productId: number,
    productDto: ProductDto,
  ): Promise<boolean> {
    const marketId = productDto.marketId;

    return this.createQueryBuilder('product')
      .update({ ...productDto })
      .whereEntity({ ...productDto, id: productId } as Product)
      .where({ id: productId, marketId })
      .execute()
      .then((updateResult) => !!updateResult?.affected);
  }
}

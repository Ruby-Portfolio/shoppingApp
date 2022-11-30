import { Repository } from 'typeorm';
import { CustomRepository } from '../../module/typeorm/typeorm.decorator';
import { Product } from './product.entity';

@CustomRepository(Product)
export class ProductRepository extends Repository<Product> {}

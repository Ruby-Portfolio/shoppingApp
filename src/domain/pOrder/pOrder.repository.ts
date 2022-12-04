import { Repository } from 'typeorm';
import { CustomRepository } from '../../module/typeorm/typeorm.decorator';
import { POrder } from './pOrder.entity';

@CustomRepository(POrder)
export class POrderRepository extends Repository<POrder> {}

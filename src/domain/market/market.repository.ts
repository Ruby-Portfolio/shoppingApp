import { Repository } from 'typeorm';
import { CustomRepository } from '../../module/typeorm/typeorm.decorator';
import { Market } from './market.entity';

@CustomRepository(Market)
export class MarketRepository extends Repository<Market> {}

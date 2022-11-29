import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CustomRepository } from '../../module/typeorm/typeorm.decorator';

@CustomRepository(User)
export class UserRepository extends Repository<User> {}

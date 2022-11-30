import { Injectable } from '@nestjs/common';
import { UserRepository } from '../user/user.repository';
import { MarketRepository } from './market.repository';

@Injectable()
export class MarketService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly marketRepository: MarketRepository,
  ) {}
}

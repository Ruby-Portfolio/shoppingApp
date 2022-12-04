import { Injectable } from '@nestjs/common';
import { POrderRepository } from './pOrder.repository';

@Injectable()
export class POrderService {
  constructor(private readonly pOrderRepository: POrderRepository) {}
}

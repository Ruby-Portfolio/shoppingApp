import { Controller } from '@nestjs/common';
import { POrderService } from './pOrder.service';

@Controller('orders')
export class POrderController {
  constructor(private readonly pOrderService: POrderService) {}
}

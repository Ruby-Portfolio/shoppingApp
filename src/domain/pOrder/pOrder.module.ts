import { Module } from '@nestjs/common';
import { CustomTypeOrmModule } from '../../module/typeorm/typeorm.module';
import { POrderService } from './pOrder.service';
import { POrderRepository } from './pOrder.repository';
import { POrderController } from './pOrder.controller';
import { OrderItemRepository } from '../orderItem/orderItem.repository';

@Module({
  imports: [
    CustomTypeOrmModule.forCustomRepository([
      POrderRepository,
      OrderItemRepository,
    ]),
  ],
  providers: [POrderService],
  controllers: [POrderController],
})
export class POrderModule {}

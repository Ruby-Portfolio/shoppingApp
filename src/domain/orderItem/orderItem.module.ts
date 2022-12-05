import { Module } from '@nestjs/common';
import { CustomTypeOrmModule } from '../../module/typeorm/typeorm.module';
import { OrderItemRepository } from './orderItem.repository';

@Module({
  imports: [CustomTypeOrmModule.forCustomRepository([OrderItemRepository])],
  providers: [],
  controllers: [],
})
export class OrderItemModule {}

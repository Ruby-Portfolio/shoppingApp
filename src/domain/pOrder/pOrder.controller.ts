import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { POrderService } from './pOrder.service';
import { JwtGuard } from '../../module/auth/jwt/jwt.guard';
import { OrderCreateDto } from './pOrder.dto';
import { CurrentUser } from '../../module/auth/auth.decorator';
import { User } from '../user/user.entity';

@Controller('orders')
export class POrderController {
  constructor(private readonly pOrderService: POrderService) {}

  @Post()
  @UseGuards(JwtGuard)
  async postOrder(
    @Body() orderCreateDto: OrderCreateDto,
    @CurrentUser() user: User,
  ): Promise<void> {
    await this.pOrderService.createOrder(orderCreateDto, user.id);
  }
}

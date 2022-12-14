import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { POrderService } from './pOrder.service';
import { JwtGuard } from '../../module/auth/jwt/jwt.guard';
import { OrderCreateDto, OrdersDto } from './pOrder.dto';
import { CurrentUser } from '../../module/auth/auth.decorator';
import { User } from '../user/user.entity';
import { IdPipe } from '../../common/pipe/id.pipe';

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

  @Get()
  @UseGuards(JwtGuard)
  async getOrdersByUser(@CurrentUser() user: User): Promise<OrdersDto> {
    return this.pOrderService.getOrdersByUser(user.id);
  }

  @Delete(':orderId')
  @UseGuards(JwtGuard)
  async deleteOrder(
    @Param('orderId', IdPipe) orderId: number,
    @CurrentUser() user: User,
  ): Promise<void> {
    await this.pOrderService.cancelOrder(orderId, user.id);
  }
}

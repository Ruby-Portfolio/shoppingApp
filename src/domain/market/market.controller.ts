import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { MarketService } from './market.service';
import { MarketCreate } from './market.dto';
import { User } from '../user/user.entity';
import { CurrentUser } from '../../module/auth/auth.decorator';
import { JwtGuard } from '../../module/auth/jwt/jwt.guard';

@Controller('markets')
export class MarketController {
  constructor(private readonly marketService: MarketService) {}

  @Post()
  @UseGuards(JwtGuard)
  async postMarket(
    @Body() marketCreate: MarketCreate,
    @CurrentUser() user: User,
  ): Promise<void> {
    await this.marketService.createMarket(marketCreate, user.id);
  }
}

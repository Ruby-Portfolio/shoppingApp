import { Body, Controller, Param, Post, Put, UseGuards } from '@nestjs/common';
import { MarketService } from './market.service';
import { MarketCreate, MarketUpdate } from './market.dto';
import { User } from '../user/user.entity';
import { CurrentUser } from '../../module/auth/auth.decorator';
import { JwtGuard } from '../../module/auth/jwt/jwt.guard';
import { IdPipe } from '../../common/validator/id.validator';

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

  @Put(':marketId')
  @UseGuards(JwtGuard)
  async putMarket(
    @Param('marketId', IdPipe) marketId: number,
    @Body() marketUpdate: MarketUpdate,
    @CurrentUser() user: User,
  ): Promise<void> {
    await this.marketService.updateMarket(marketId, marketUpdate, user.id);
  }

  @Put(':marketId')
  @UseGuards(JwtGuard)
  async deleteMarket(
    @Param('marketId', IdPipe) marketId: number,
    @CurrentUser() user: User,
  ): Promise<void> {
    await this.marketService.deleteMarket(marketId, user.id);
  }
}

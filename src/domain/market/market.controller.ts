import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { MarketService } from './market.service';
import { MarketDto } from './market.dto';
import { User } from '../user/user.entity';
import { CurrentUser } from '../../module/auth/auth.decorator';
import { JwtGuard } from '../../module/auth/jwt/jwt.guard';
import { IdPipe } from '../../common/pipe/id.pipe';

@Controller('markets')
export class MarketController {
  constructor(private readonly marketService: MarketService) {}

  @Post()
  @UseGuards(JwtGuard)
  async postMarket(
    @Body() marketDto: MarketDto,
    @CurrentUser() user: User,
  ): Promise<void> {
    await this.marketService.createMarket(marketDto, user.id);
  }

  @Put(':marketId')
  @UseGuards(JwtGuard)
  async putMarket(
    @Param('marketId', IdPipe) marketId: number,
    @Body() marketDto: MarketDto,
    @CurrentUser() user: User,
  ): Promise<void> {
    await this.marketService.updateMarket(marketId, marketDto, user.id);
  }

  @Delete(':marketId')
  @UseGuards(JwtGuard)
  async deleteMarket(
    @Param('marketId', IdPipe) marketId: number,
    @CurrentUser() user: User,
  ): Promise<void> {
    await this.marketService.deleteMarket(marketId, user.id);
  }
}

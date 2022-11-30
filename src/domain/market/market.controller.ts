import { Controller } from '@nestjs/common';
import { MarketService } from './market.service';

@Controller('markets')
export class MarketController {
  constructor(private readonly marketService: MarketService) {}
}

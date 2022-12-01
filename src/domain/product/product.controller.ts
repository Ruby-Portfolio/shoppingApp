import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ProductService } from './product.service';
import { JwtGuard } from '../../module/auth/jwt/jwt.guard';
import { CurrentUser } from '../../module/auth/auth.decorator';
import { User } from '../user/user.entity';
import { ProductCreate } from './product.dto';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @UseGuards(JwtGuard)
  async postProduct(
    @Body() productCreate: ProductCreate,
    @CurrentUser() user: User,
  ): Promise<void> {
    await this.productService.createProduct(productCreate, user.id);
  }
}

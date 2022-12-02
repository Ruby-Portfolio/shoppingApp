import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { JwtGuard } from '../../module/auth/jwt/jwt.guard';
import { CurrentUser } from '../../module/auth/auth.decorator';
import { User } from '../user/user.entity';
import { ProductDeleteDto, ProductDto } from './product.dto';
import { IdPipe } from '../../common/pipe/id.pipe';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @UseGuards(JwtGuard)
  async postProduct(
    @Body() productDto: ProductDto,
    @CurrentUser() user: User,
  ): Promise<void> {
    await this.productService.createProduct(productDto, user.id);
  }

  @Put(':productId')
  @UseGuards(JwtGuard)
  async putProduct(
    @Param('productId', IdPipe) productId: number,
    @Body() productDto: ProductDto,
    @CurrentUser() user: User,
  ): Promise<void> {
    await this.productService.updateProduct(productId, productDto, user.id);
  }

  @Delete(':productId')
  @UseGuards(JwtGuard)
  async deleteProduct(
    @Param('productId', IdPipe) productId: number,
    @Body() productDeleteDto: ProductDeleteDto,
    @CurrentUser() user: User,
  ): Promise<void> {
    await this.productService.deleteProduct(
      productId,
      productDeleteDto.marketId,
      user.id,
    );
  }
}

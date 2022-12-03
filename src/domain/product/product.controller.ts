import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { JwtGuard } from '../../module/auth/jwt/jwt.guard';
import { CurrentUser } from '../../module/auth/auth.decorator';
import { User } from '../user/user.entity';
import {
  ProductDeleteDto,
  ProductDetailDto,
  ProductDto,
  ProductsDto,
  ProductsSearch,
} from './product.dto';
import { IdPipe } from '../../common/pipe/id.pipe';
import { ProductCacheInterceptor } from './product.interceptor';

@Controller('products')
@UseInterceptors(ProductCacheInterceptor)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  // interceptor 를 통해 CUD 요청시 목록을 초기화 해야함

  @Post()
  @UseGuards(JwtGuard)
  async postProduct(
    @Body() productDto: ProductDto,
    @CurrentUser() user: User,
  ): Promise<void> {
    await this.productService.createProduct(productDto, user.id);
  }

  @Get(':productId')
  async getProductDetail(
    @Param('productId', IdPipe) productId: number,
  ): Promise<ProductDetailDto> {
    return this.productService.getProductDetail(productId);
  }

  @Get()
  @UseInterceptors(ProductCacheInterceptor)
  async getProducts(
    @Body() productsSearch: ProductsSearch,
  ): Promise<ProductsDto> {
    return this.productService.getProducts(productsSearch);
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

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import {
  FileFieldsInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import {
  CreateProductItemDTO,
  CreateProductDTO,
  UpdateProductDTO,
  UpdateProductItemDTO,
} from '../../dto/request';
import { imageFileFilter } from '../../utils/image-file-filter';
import { ValidateMongoId } from '../../utils/validate-pipe';
import { ProductService } from './product.service';

@ApiTags('Product')
@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  createProduct(@Body() dto: CreateProductDTO) {
    return this.productService.createProduct(dto);
  }

  @Post('/item')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'thumbnail', maxCount: 1 },
      { name: 'images', maxCount: 10 },
    ]),
  )
  @ApiBody({ type: CreateProductItemDTO })
  creteProductItem(
    @Body() dto: CreateProductItemDTO,
    @UploadedFiles()
    files: {
      thumbnail?: Express.Multer.File[];
      images?: Express.Multer.File[];
    },
  ) {
    (dto.thumbnail = files.thumbnail[0]), (dto.images = files.images);
    return this.productService.createProductItem(dto);
  }

  @Get('/list-name')
  getProductNames() {
    return this.productService.getProductName();
  }

  @Get('/dashboard')
  getProductDashboard() {
    return this.productService.getProductDashboard();
  }

  @Delete('/dashboard/product-item/:productId/:productItemId')
  deleteProductItem(
    @Param('productId', ValidateMongoId) productId: string,
    @Param('productItemId', ValidateMongoId) productItemId: string,
  ) {
    return this.productService.deleteProductItem(productId, productItemId);
  }

  @Delete('/dashboard/product/:productId')
  deleteProduct(@Param('productId', ValidateMongoId) productId: string) {
    return this.productService.deleteProduct(productId);
  }

  @Get('/dashboard/product/:productId')
  findProductById(@Param('productId', ValidateMongoId) productId: string) {
    return this.productService.findProductById(productId);
  }

  @Put('/dashboard/product/:productId')
  findProductByIdAndUpdate(
    @Param('productId', ValidateMongoId) productId: string,
    @Body() body: UpdateProductDTO,
  ) {
    return this.productService.updateProduct(productId, body);
  }

  @Get('/dashboard/product/:productId/product-item/:itemId')
  findProdItemById(
    @Param('productId', ValidateMongoId) productId: string,
    @Param('itemId', ValidateMongoId) itemId: string,
  ) {
    return this.productService.findProductItemById(itemId, productId);
  }

  @Put('/dashboard/product-item/:itemId')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'thumbnail', maxCount: 1 },
      { name: 'images', maxCount: 10 },
    ]),
  )
  @ApiBody({ type: UpdateProductItemDTO })
  updateProdItem(
    @Param('itemId', ValidateMongoId) itemId: string,
    @Body() dto: UpdateProductItemDTO,
    @UploadedFiles()
    files: {
      thumbnail?: Express.Multer.File[];
      images?: Express.Multer.File[];
    },
  ) {
    if (files.thumbnail) {
      dto.thumbnail = files.thumbnail[0];
    }
    if (files.images) {
      dto.images = files.images;
    }
    return this.productService.updateProductItem(itemId, dto);
  }
}

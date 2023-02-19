import {
  Body,
  Controller,
  Get,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import {
  FileFieldsInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { CreateProductItemDTO, CreateProductDTO } from '../../dto/request';
import { imageFileFilter } from '../../utils/image-file-filter';
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
}

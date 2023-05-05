import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import {
  CreateProductItemDTO,
  CreateProductDTO,
  UpdateProductDTO,
  UpdateProductItemDTO,
  RandomPagination,
  ProductItemsByCategoryAndOptionsDTO,
  LoadMorePagination,
  SearchProductDTO,
  CreateCommentDTO,
  UpdateCommentDTO,
  PagePagination,
  CommentPagination,
  FilterProductAdminDTO,
  ProductItemsByBrandAndOptionsDTO,
} from '../../dto/request';
import { JwtGuard } from '../../guards/jwt.guard';
import { ValidateMongoId } from '../../utils/validate-pipe';
import { ProductService } from './product.service';
import { query, Request } from 'express';
import { Role } from '../../constances/enum';
import { Roles } from '../../decorator/role.decorator';
import { RolesGuard } from '../../guards/role.guard';

@ApiTags('Product')
@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @ApiBearerAuth('access_token')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  @UseGuards(JwtGuard)
  createProduct(@Body() dto: CreateProductDTO) {
    return this.productService.createProduct(dto);
  }

  @Post('/item')
  @ApiBearerAuth('access_token')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  @UseGuards(JwtGuard)
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
  @ApiBearerAuth('access_token')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  @UseGuards(JwtGuard)
  getProductNames() {
    return this.productService.getProductName();
  }

  @Get('/dashboard')
  @ApiBearerAuth('access_token')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  @UseGuards(JwtGuard)
  getProductDashboard(@Query() query: FilterProductAdminDTO) {
    return this.productService.getProductDashboard(query);
  }

  @Delete('/dashboard/product-item/:productId/:productItemId')
  @ApiBearerAuth('access_token')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  @UseGuards(JwtGuard)
  deleteProductItem(
    @Param('productId', ValidateMongoId) productId: string,
    @Param('productItemId', ValidateMongoId) productItemId: string,
  ) {
    return this.productService.deleteProductItem(productId, productItemId);
  }

  @Delete('/dashboard/product/:productId')
  @ApiBearerAuth('access_token')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  @UseGuards(JwtGuard)
  deleteProduct(@Param('productId', ValidateMongoId) productId: string) {
    return this.productService.deleteProduct(productId);
  }

  @Get('/dashboard/product/:productId')
  findProductById(@Param('productId', ValidateMongoId) productId: string) {
    return this.productService.findProductById(productId);
  }

  @Put('/dashboard/product/:productId')
  @ApiBearerAuth('access_token')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  @UseGuards(JwtGuard)
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
  @ApiBearerAuth('access_token')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  @UseGuards(JwtGuard)
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

  @Get('/product-items')
  getProductItems() {
    return this.productService.getProductItems();
  }

  @Get('/product-detail/:prodItemId/rating')
  getRatingAndComment(
    @Param('prodItemId', ValidateMongoId) prodItemId: string,
  ) {
    return this.productService.getRating(prodItemId);
  }

  @Get('/product-detail/:prodItemId/comment/pagination')
  getCommentPagination(
    @Param('prodItemId', ValidateMongoId) prodItemId: string,
    @Query() query: CommentPagination,
  ) {
    return this.productService.getCommentPagination(prodItemId, query);
  }

  @Get('/product-detail/:productId/:itemId')
  getProductItemDetail(
    @Param('productId', ValidateMongoId) productId: string,
    @Param('itemId', ValidateMongoId) itemId: string,
  ) {
    return this.productService.getProductItemDetail(productId, itemId);
  }

  @Post('/product-items/category/:id?')
  getProductItemsByCategoryWithOtherOptions(
    @Param('id') id: string,
    @Query() query: ProductItemsByCategoryAndOptionsDTO,
    @Body() body: LoadMorePagination,
  ) {
    return this.productService.getProductByCategoryAndOptions(id, body, query);
  }

  @Post('/search')
  search(@Query() query: SearchProductDTO, @Body() body: LoadMorePagination) {
    return this.productService.search(query.search, body, query);
  }

  @Get('/recommend/cf/:id')
  getRecommendCF(@Param('id') id: string) {
    return this.productService.recommendCF(id);
  }

  @ApiBearerAuth('access_token')
  @UseGuards(JwtGuard)
  @Get('/recommend/item-based')
  getRecommendItemBased(@Req() req: Request) {
    return this.productService.recommendItemBased((req.user as IJWTInfo)._id);
  }

  @ApiBearerAuth('access_token')
  @UseGuards(JwtGuard)
  @Post('/comment')
  createComment(@Body() body: CreateCommentDTO, @Req() req: Request) {
    return this.productService.createComment(body, (req.user as IJWTInfo)._id);
  }

  @ApiBearerAuth('access_token')
  @UseGuards(JwtGuard)
  @Put('/comment/:commentId')
  updateComment(
    @Body() body: UpdateCommentDTO,
    @Param('commentId', ValidateMongoId) commentId: string,
  ) {
    return this.productService.updateComment(body, commentId);
  }

  // @Get('/product-item-random')
  // getProductItemRandom() {
  //   return this.productService.ramdomProdutItem();
  // }

  @Post('/product-items/brand/:id/options?')
  getProductItemsByBrandWithOtherOptions(
    @Param('id') id: string,
    @Query() query: ProductItemsByBrandAndOptionsDTO,
    @Body() body: LoadMorePagination,
  ) {
    return this.productService.getProductByBrandAndOptions(id, body, query);
  }

  @Get('/category-id/:id')
  getCategoryIdOfProduct(@Param('id') id: string) {
    return this.productService.getCategoryIdByProductId(id);
  }

  @ApiBearerAuth('access_token')
  @UseGuards(JwtGuard)
  @Get('/has-comments')
  checkUserHasComments(@Req() req: Request) {
    return this.productService.checkUserHasComments((req.user as IJWTInfo)._id);
  }
}

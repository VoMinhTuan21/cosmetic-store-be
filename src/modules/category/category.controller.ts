import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import {
  CreateBrandDTO,
  CreateLeafCategory,
  CreateRootCategoryDTO,
  UpdateRootCategoryDTO,
} from '../../dto/request';
import { CategoryService } from './category.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { imageFileFilter } from '../../utils/image-file-filter';
import { ValidateMongoId } from '../../utils/validate-pipe';

@ApiTags('Category')
@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post('/leaf')
  createLeafCategory(@Body() body: CreateLeafCategory) {
    console.log('body: ', body);
    return this.categoryService.createLeafCategory(body);
  }

  @Post('/root')
  @UseInterceptors(
    FileInterceptor('icon', {
      fileFilter: imageFileFilter,
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateRootCategoryDTO })
  async createRootCategory(
    @Body() body: CreateRootCategoryDTO,
    @UploadedFile() icon: Express.Multer.File,
  ) {
    return await this.categoryService.createRootCategory(body, icon);
  }

  @Put('/root/:id')
  @UseInterceptors(
    FileInterceptor('icon', {
      fileFilter: imageFileFilter,
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateRootCategoryDTO })
  async updateRootCategory(
    @Param('id', ValidateMongoId) id: string,
    @Body() body: UpdateRootCategoryDTO,
    @UploadedFile() icon: Express.Multer.File,
  ) {
    return await this.categoryService.updateRootCategory(id, body, icon);
  }

  @Get('/leaf')
  getLeafCategories() {
    return this.categoryService.getLeaf();
  }

  @Get()
  getParentCategories() {
    return this.categoryService.get();
  }

  @Get('/:id')
  getlistId(@Param('id') id: string) {
    return this.categoryService.getListChidrenCategoryIds(id);
  }
}

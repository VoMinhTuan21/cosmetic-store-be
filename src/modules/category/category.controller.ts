import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateCategory, UpdateCategoryDTO } from '../../dto/request';
import { CategoryService } from './category.service';

@ApiTags('Category')
@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  create(@Body() body: CreateCategory) {
    console.log('body: ', body);
    return this.categoryService.create(body);
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

  @Delete('/:id')
  delete(@Param('id') id: string) {
    return this.categoryService.deletCategory(id);
  }

  @Put('/child/:id')
  updateCategoryChild(@Param('id') id: string, @Body() dto: UpdateCategoryDTO) {
    return this.categoryService.updateCategoryChild(id, dto.nameVi, dto.nameEn);
  }

  @Get('/list-children/:id')
  getListChildren(@Param('id') id: string) {
    return this.categoryService.getAllChidrenCategoryIds(id);
  }
}

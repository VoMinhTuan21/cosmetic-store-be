import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateCategory } from '../../dto/request';
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
}

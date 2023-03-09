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
import { CreateTagDTO, UpdateTagDTO } from '../../dto/request';
import { TagService } from './tag.service';

@ApiTags('Tag')
@Controller('tag')
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Post()
  create(@Body() dto: CreateTagDTO) {
    return this.tagService.create(dto);
  }

  @Put()
  update(@Body() dto: UpdateTagDTO) {
    return this.tagService.update(dto);
  }

  @Delete('/:id')
  delete(@Param('id') id: string) {
    return this.tagService.delete(id);
  }

  @Get()
  get() {
    return this.tagService.get();
  }
}

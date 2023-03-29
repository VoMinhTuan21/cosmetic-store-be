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
import {
  CreateTagDTO,
  CreateTagGroupDTO,
  UpdateTagDTO,
  UpdateTagGroupDTO,
} from '../../dto/request';
import { ValidateMongoId } from '../../utils/validate-pipe';
import { TagService } from './tag.service';

@ApiTags('Tag')
@Controller('tag')
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Post()
  create(@Body() dto: CreateTagDTO) {
    return this.tagService.createTag(dto);
  }

  @Post('/tag-group')
  createTagGroup(@Body() dto: CreateTagGroupDTO) {
    return this.tagService.createTagGroup(dto);
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
    return this.tagService.getTagsTable();
  }

  @Put('/tag-group/:tagGroupId')
  updateTagGroup(
    @Param('tagGroupId', ValidateMongoId) tagGroupId: string,
    @Body() body: UpdateTagGroupDTO,
  ) {
    return this.tagService.updateTagGroup(tagGroupId, body.name);
  }
}

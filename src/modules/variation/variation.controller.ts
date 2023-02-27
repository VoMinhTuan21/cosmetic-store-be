import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  CreateVariation,
  CreateVariationOptionsDTO,
  QueryGetVariationOptionsDTO,
} from '../../dto/request';
import { VariationService } from './variation.service';

@ApiTags('Variation')
@Controller('variation')
export class VariationController {
  constructor(private readonly variationService: VariationService) {}

  @Post()
  createVariation(@Body() dto: CreateVariation) {
    return this.variationService.createVariation(dto);
  }

  @Post('/options')
  createVariationOption(@Body() dto: CreateVariationOptionsDTO) {
    return this.variationService.createVariationOptions(dto);
  }

  @Get()
  get() {
    return this.variationService.get();
  }

  @Get('/options?')
  getVariationOptions(@Query() query: QueryGetVariationOptionsDTO) {
    return this.variationService.getVaritionOptions(query.parentId);
  }

  @Get('/table')
  getVariationTable() {
    return this.variationService.getVariationsTable();
  }

  @Delete('/option/:id')
  deleteVariationOption(@Param('id') id: string) {
    return this.variationService.deleteVariationOption(id);
  }
}

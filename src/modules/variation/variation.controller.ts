import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  CreateVariation,
  CreateVariationOption,
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

  @Post('/option')
  createVariationOption(@Body() dto: CreateVariationOption) {
    return this.variationService.createVariationOption(dto);
  }

  @Get()
  get() {
    return this.variationService.get();
  }

  @Get('/options?')
  getVariationOptions(@Query() query: QueryGetVariationOptionsDTO) {
    return this.variationService.getVaritionOptions(query.parentId);
  }
}

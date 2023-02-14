import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  CreateVariation,
  CreateVariationOption,
} from '../../../dto/request/variant.dto';
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
}

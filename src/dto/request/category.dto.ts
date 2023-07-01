import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsMongoId,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Translation } from './common.dto';

export class CreateCategory {
  @ApiProperty({ type: String })
  @IsMongoId()
  @IsOptional()
  parentCategory: string;

  @ApiProperty({ type: [Translation] })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => Translation)
  name: Translation[];
}

export class UpdateCategoryDTO {
  @ApiPropertyOptional()
  @IsString()
  nameVi?: string;

  @ApiPropertyOptional()
  @IsString()
  nameEn?: string;
}

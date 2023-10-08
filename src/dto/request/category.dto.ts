import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Translation } from './common.dto';
import { Language } from '../../constances/enum';

export class CreateLeafCategory {
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

export class CreateRootCategoryDTO {
  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  nameVi: string;

  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  nameEn: string;

  @ApiProperty({ type: 'string', format: 'binary' })
  icon: Express.Multer.File;
}

export class UpdateRootCategoryDTO {
  @ApiPropertyOptional({ type: String })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  nameVi?: string;

  @ApiPropertyOptional({ type: String })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  nameEn?: string;

  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  icon?: Express.Multer.File;
}

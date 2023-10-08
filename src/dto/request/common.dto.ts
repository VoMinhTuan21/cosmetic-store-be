import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Language } from '../../constances/enum';

export class Translation {
  @ApiProperty({ enum: Language, default: Language.vi })
  @IsEnum(Language)
  language: Language;

  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  value: string;
}

export class TranslationV2 {
  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  vi: string;

  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  en: string;
}

export class RandomPagination {
  @ApiPropertyOptional({
    type: [String],
  })
  @IsMongoId({ each: true })
  @IsOptional()
  previous: string[];

  @ApiProperty({
    type: String,
  })
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  limit: number;
}

export class LoadMorePagination {
  @ApiPropertyOptional({
    type: String,
  })
  @IsOptional()
  @IsMongoId()
  after: string;

  @ApiProperty({
    type: String,
  })
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  limit: number;
}

export class Coordinates {
  @ApiProperty({
    type: String,
  })
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  latitude: number;

  @ApiProperty({
    type: String,
  })
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  longitude: number;
}

export class PagePagination {
  @ApiProperty({
    type: Number,
  })
  @IsNotEmpty()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  page: number;

  @ApiProperty({
    type: Number,
  })
  @IsNotEmpty()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  limit: number;
}

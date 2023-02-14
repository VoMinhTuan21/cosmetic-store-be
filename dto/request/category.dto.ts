import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsMongoId,
  IsNotEmpty,
  ValidateNested,
} from 'class-validator';
import { Translation } from './common.dto';

export class CreateCategory {
  @ApiProperty({ type: String })
  @IsMongoId()
  parentCategory: string;

  @ApiProperty({ type: [Translation] })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => Translation)
  name: Translation[];
}

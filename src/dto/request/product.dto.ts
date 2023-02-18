import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { ObjectId } from 'mongodb';
import { Translation } from './common.dto';

export class CreateProductItemDTO {
  @ApiProperty({
    type: 'string',
  })
  @IsNumberString()
  @IsNotEmpty()
  price: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
  })
  thumbnail: Express.Multer.File;

  @ApiProperty({
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
  })
  images: Express.Multer.File[];

  @ApiPropertyOptional({
    isArray: true,
    type: String,
  })
  @Transform(({ value }) => {
    return Array.isArray(value) ? value : value.split(',');
  })
  @IsMongoId({ each: true })
  @IsOptional()
  productConfiguration: string[];

  @ApiProperty({
    type: 'string',
  })
  @IsMongoId()
  productId: string;
}

export class CreateProductDTO {
  @ApiProperty({
    type: [Translation],
  })
  @ValidateNested({ each: true })
  @Type(() => Translation)
  name: Translation[];

  @ApiProperty({
    type: [Translation],
  })
  @ValidateNested({ each: true })
  @Type(() => Translation)
  description: Translation[];

  @ApiPropertyOptional({
    isArray: true,
    type: String,
  })
  @Transform(({ value }) => {
    return Array.isArray(value) ? value : value.split(',');
  })
  @IsMongoId({ each: true })
  @ArrayMinSize(1)
  categories: string[];

  @Transform(({ value }) => {
    return Array.isArray(value) ? value : value.split(',');
  })
  @IsMongoId({ each: true })
  @ArrayMinSize(1)
  variations: string[];

  @ApiProperty({
    type: 'string',
  })
  @IsMongoId()
  brand: string;
}

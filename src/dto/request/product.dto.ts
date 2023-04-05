import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsEnum,
  IsMongoId,
  isNotEmpty,
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import mongoose from 'mongoose';
import { Search } from '../../constances/enum';
import { PagePagination, Translation } from './common.dto';

export class CreateProductItemDTO {
  @ApiProperty({
    type: 'string',
  })
  @IsNumberString()
  @IsNotEmpty()
  price: string;

  @ApiProperty({
    type: 'string',
  })
  @IsNumberString()
  @IsNotEmpty()
  quantity: string;

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

  @ApiPropertyOptional({
    isArray: true,
    type: String,
  })
  @Transform(({ value }) => {
    return Array.isArray(value) ? value : value.split(',');
  })
  @IsMongoId({ each: true })
  @IsOptional()
  tags: string[];

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

  @ApiPropertyOptional({
    isArray: true,
    type: String,
  })
  @Transform(({ value }) => {
    return Array.isArray(value) ? value : value.split(',');
  })
  @IsOptional()
  @IsMongoId({ each: true })
  @ArrayMinSize(1)
  variations: string[];

  @ApiProperty({
    type: 'string',
  })
  @IsMongoId()
  brand: string;
}

export class UpdateProductDTO {
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

  @ApiProperty({
    type: 'string',
  })
  @IsMongoId()
  brand: string;
}

export class UpdateProductItemDTO {
  @ApiProperty({
    type: 'string',
  })
  @IsNumberString()
  @IsNotEmpty()
  price: string;

  @ApiProperty({
    type: 'string',
  })
  @IsNumberString()
  @IsNotEmpty()
  quantity: string;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
  })
  @IsOptional()
  thumbnail: Express.Multer.File;

  @ApiPropertyOptional({
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
  })
  @IsOptional()
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

  @ApiPropertyOptional({
    isArray: true,
    type: String,
  })
  @Transform(({ value }) => {
    return Array.isArray(value) ? value : value.split(',');
  })
  @IsMongoId({ each: true })
  @IsOptional()
  tags: string[];

  @ApiProperty({
    type: 'string',
  })
  @IsMongoId()
  productId: string;
}

export class ProductItemsByCategoryAndOptionsDTO {
  @ApiPropertyOptional({
    type: String,
  })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  from: number;

  @ApiPropertyOptional({
    type: String,
  })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  to: number;

  @ApiPropertyOptional({
    type: String,
    enum: ['asc', 'desc', 'def'],
  })
  @IsOptional()
  @IsString()
  order: 'asc' | 'desc' | 'def';

  @ApiPropertyOptional({
    isArray: true,
    type: String,
  })
  @Transform(({ value }) => {
    return Array.isArray(value) ? value : value.split(',');
  })
  @IsMongoId({ each: true })
  @IsOptional()
  brands: string;
}

export class SearchProductDTO extends ProductItemsByCategoryAndOptionsDTO {
  @ApiPropertyOptional({
    type: String,
  })
  @IsOptional()
  search: string;
}

export class CreateCommentDTO {
  @ApiProperty({ type: String })
  @IsNumber()
  @IsNotEmpty()
  @Transform(({ value }) => parseInt(value))
  rate: number;

  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ type: String })
  @IsMongoId()
  @IsNotEmpty()
  productItemId: string;

  @ApiProperty({ type: String })
  @IsMongoId()
  @IsNotEmpty()
  orderItemId: string;
}

export class UpdateCommentDTO {
  @ApiProperty({ type: String })
  @IsNumber()
  @IsNotEmpty()
  @Transform(({ value }) => parseInt(value))
  rate: number;

  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ type: String })
  @IsMongoId()
  @IsNotEmpty()
  productItemId: string;
}

export class CommentPagination extends PagePagination {
  @ApiPropertyOptional({ type: String })
  @IsNumber()
  @IsOptional()
  @IsNotEmpty()
  @Transform(({ value }) => parseInt(value))
  rate?: number;
}

export class FilterProductAdminDTO extends PagePagination {
  @ApiPropertyOptional({
    type: String,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  search: string;

  @ApiPropertyOptional({
    type: String,
    enum: Search,
  })
  @IsOptional()
  @IsNotEmpty()
  @IsEnum(Search)
  type: Search;

  @ApiPropertyOptional({
    isArray: true,
    type: String,
  })
  @Transform(({ value }) => {
    return Array.isArray(value) ? value : value.split(',');
  })
  @IsMongoId({ each: true })
  @IsOptional()
  brands: string[];

  @ApiPropertyOptional({
    isArray: true,
    type: String,
  })
  @Transform(({ value }) => {
    return Array.isArray(value) ? value : value.split(',');
  })
  @IsMongoId({ each: true })
  @IsOptional()
  category: string[];
}

export class ProductItemsByBrandAndOptionsDTO {
  @ApiPropertyOptional({
    type: String,
  })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  from: number;

  @ApiPropertyOptional({
    type: String,
  })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  to: number;

  @ApiPropertyOptional({
    type: String,
    enum: ['asc', 'desc', 'def'],
  })
  @IsOptional()
  @IsString()
  order: 'asc' | 'desc' | 'def';
}

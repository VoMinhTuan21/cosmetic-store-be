import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
} from 'class-validator';

export class CreateProductItem {
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
    type: 'array',
    items: {
      type: 'string',
    },
  })
  @IsMongoId({ each: true })
  @IsOptional()
  @ArrayMinSize(1)
  productConfiguration: string[];
}

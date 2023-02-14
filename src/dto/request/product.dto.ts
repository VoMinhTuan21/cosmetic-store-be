import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumberString } from 'class-validator';

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
}

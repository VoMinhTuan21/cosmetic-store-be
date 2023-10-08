import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateBrandDTO {
  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ type: 'string', format: 'binary' })
  logo: Express.Multer.File;
}

export class UpdateBrandDTO {
  @ApiPropertyOptional({ type: String })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name: string;

  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  @IsOptional()
  logo: Express.Multer.File;
}

export class GetBrandDTO {
  @ApiPropertyOptional({
    type: String,
  })
  @IsOptional()
  @IsMongoId()
  category: string;

  @ApiPropertyOptional({
    type: String,
  })
  @IsOptional()
  search: string;
}

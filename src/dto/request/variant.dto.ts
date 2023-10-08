import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Translation, TranslationV2 } from './common.dto';

export class CreateVariation {
  @ApiProperty({
    type: [Translation],
  })
  @ValidateNested({ each: true })
  @Type(() => Translation)
  name: Translation[];

  @ApiPropertyOptional({
    type: [TranslationV2],
  })
  @IsOptional()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TranslationV2)
  options: TranslationV2[];
}

export class CreateVariationOptionsDTO {
  @ApiProperty({
    type: String,
  })
  @IsMongoId()
  @IsNotEmpty()
  parentVariation: string;

  @ApiProperty({
    type: [TranslationV2],
  })
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TranslationV2)
  options: TranslationV2[];
}

export class QueryGetVariationOptionsDTO {
  @ApiProperty({ type: String })
  @IsMongoId()
  @IsNotEmpty()
  parentId: string;
}

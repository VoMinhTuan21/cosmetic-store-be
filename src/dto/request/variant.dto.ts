import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsMongoId, IsNotEmpty, ValidateNested } from 'class-validator';
import { Translation } from './common.dto';

export class CreateVariation {
  @ApiProperty({
    type: [Translation],
  })
  @ValidateNested({ each: true })
  @Type(() => Translation)
  name: Translation[];
}

export class CreateVariationOption {
  @ApiProperty({
    type: String,
  })
  @IsMongoId()
  @IsNotEmpty()
  parentVariation: string;

  @ApiProperty({
    type: [Translation],
  })
  @ValidateNested({ each: true })
  @Type(() => Translation)
  name: Translation[];
}

export class QueryGetVariationOptionsDTO {
  @ApiProperty({ type: String })
  @IsMongoId()
  @IsNotEmpty()
  parentId: string;
}

import { ApiProperty, PickType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsMongoId, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateTagDTO {
  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    type: String,
  })
  @IsMongoId()
  @IsNotEmpty()
  parent: string;

  @ApiProperty({
    type: String,
  })
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  weight: number;
}

export class UpdateTagDTO extends CreateTagDTO {
  @ApiProperty({ type: String })
  @IsMongoId()
  @IsNotEmpty()
  id: string;
}

export class CreateTagGroupDTO extends PickType(CreateTagDTO, [
  'name',
] as const) {}

export class UpdateTagGroupDTO {
  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  name: string;
}

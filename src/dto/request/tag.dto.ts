import { ApiProperty } from '@nestjs/swagger';
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

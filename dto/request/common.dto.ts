import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Language } from '../../src/constances/enum';

export class Translation {
  @ApiProperty({ enum: Language, default: Language.vi })
  @IsEnum(Language)
  language: Language;

  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  value: string;
}

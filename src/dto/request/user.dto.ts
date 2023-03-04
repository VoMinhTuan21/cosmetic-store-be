import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Gender } from '../../constances/enum';
import { NotMatch } from '../../decorator/not-match.decorator';

export class UpdateUserDTO {
  @ApiPropertyOptional({
    type: String,
  })
  @IsOptional()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    type: String,
    enum: Gender,
  })
  @IsOptional()
  @IsNotEmpty()
  gender: Gender;

  @ApiPropertyOptional({
    type: String,
  })
  @IsOptional()
  @IsNotEmpty()
  @IsDateString()
  birthday: string;
}

export class ChangePassDTO {
  @ApiProperty({
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  oldPass: string;

  @ApiProperty({
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  @NotMatch('oldPass')
  newPass: string;
}

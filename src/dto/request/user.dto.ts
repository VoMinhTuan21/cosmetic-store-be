import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Gender } from '../../constances/enum';
import { NotMatch } from '../../decorator/not-match.decorator';
import { Coordinates } from './common.dto';

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

export class AddressDTO {
  @ApiProperty({
    type: String,
    default: 'Võ Minh Tuấn',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    type: String,
    default: '0869287417',
  })
  @Matches(/(03|05|07|08|09|01[2689])+([0-9]{8})\b/, {
    message: 'Phone number is not in correct Vietnamese phone number format',
  })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    type: String,
    default: 'Thành phố Cần Thơ',
  })
  @IsString()
  @IsNotEmpty()
  province: string;

  @ApiProperty({
    type: String,
    default: 'Huyện Cờ Đỏ',
  })
  @IsString()
  @IsNotEmpty()
  district: string;

  @ApiProperty({
    type: String,
    default: 'Thị trấn Cờ Đỏ',
  })
  @IsString()
  @IsNotEmpty()
  ward: string;

  @ApiProperty({
    type: String,
    default: 'Khối 4B',
  })
  @IsString()
  @IsNotEmpty()
  specificAddress: string;

  @ApiProperty({
    type: Coordinates,
    default: {
      latitude: 10.87989100815666,
      longitude: 106.80831257931847,
    },
  })
  @ValidateNested()
  @Type(() => Coordinates)
  coordinates: Coordinates;
}

export class CreatePassDTO {
  @ApiProperty({
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  password: string;
}

import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsDateString, IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { Gender } from '../../constances/enum';

export class CreateAdminDTO {
  @ApiProperty({
    type: String,
    default: 'vominhtuan.8a1@gmail.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    type: String,
    default: 'vominhtuan8121',
  })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    type: String,
  })
  @IsNotEmpty()
  @IsDateString()
  birthday: string;

  @ApiProperty({
    type: String,
    enum: Gender,
  })
  @IsNotEmpty()
  gender: Gender;

  @ApiProperty({
    type: String,
  })
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    type: String,
  })
  @IsNotEmpty()
  code: string;
}

export class SignInAdminDTO extends PickType(CreateAdminDTO, [
  'email',
  'password',
] as const) {}

export class UpdateAdminDTO extends PickType(CreateAdminDTO, [
  'birthday',
  'gender',
  'name',
] as const) {}

import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { Gender } from '../../src/constances/enum';

export class DefaultUser {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  name?: string | null;

  @ApiProperty()
  @IsString()
  @IsOptional()
  email?: string | null;

  @ApiProperty()
  @IsString()
  @IsOptional()
  image?: string | null;
}

export declare type ProviderType = 'oauth' | 'email' | 'credentials';

export class Account {
  @ApiProperty()
  @IsString()
  @IsOptional()
  access_token?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  token_type?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  id_token?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  refresh_token?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  scope?: string;

  @ApiProperty()
  @IsNumberString()
  @IsOptional()
  expires_at?: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  session_state?: string;

  @ApiProperty()
  @IsString()
  providerAccountId: string;

  @ApiProperty()
  @IsString()
  provider: string;

  @ApiProperty({
    enum: ['oauth', 'email', 'credentials'],
  })
  @IsEnum(['oauth', 'email', 'credentials'])
  type: ProviderType;
}

export class SignInWithSocialMediaDTO {
  @ApiProperty()
  @IsNotEmpty()
  user: DefaultUser;

  @ApiProperty()
  @IsNotEmpty()
  account: Account;
}

export class SignUpWithPassword {
  @ApiProperty({ type: String, default: 'voxuantucntt@gmail.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ type: String, default: '123456789' })
  @IsString()
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/, {
    message:
      'Password must contain at least 1 letter, 1 number, 1 special character, and be at least 8 characters long',
  })
  @IsNotEmpty()
  password: string;

  @ApiProperty({ type: String, default: 'Vo Xuan Tu' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ type: String, default: '123456' })
  @IsNumberString()
  @Length(6)
  @IsNotEmpty()
  code: string;

  @ApiProperty({ type: String, default: '2001-01-01' })
  @IsDateString()
  @IsNotEmpty()
  birthday: string;

  @ApiProperty({ enum: Gender, default: Gender.Male })
  @IsEnum(Gender)
  @IsNotEmpty()
  gender: Gender;
}

import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';

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

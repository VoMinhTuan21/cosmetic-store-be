import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class SignatureDTO {
  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  secretKey: string;

  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  rawSignature: string;
}

export class MomoPaymentDTO {
  @ApiPropertyOptional({ type: String })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  partnerCode: string;

  @ApiPropertyOptional({ type: String })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  orderId: string;

  @ApiPropertyOptional({ type: String })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  requestId: string;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNotEmpty()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  amount: number;

  @ApiPropertyOptional({ type: String })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  orderInfo: string;

  @ApiPropertyOptional({ type: String })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  orderType: string;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNotEmpty()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  transId: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNotEmpty()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  resultCode: number;

  @ApiPropertyOptional({ type: String })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({ type: String })
  @IsString()
  @IsOptional()
  payType: string;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNotEmpty()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  responseTime: number;

  @ApiPropertyOptional({ type: String })
  @IsString()
  @IsOptional()
  extraData: string;

  @ApiPropertyOptional({ type: String })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  signature: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsDateString,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { PaymentMethod } from '../../constances/enum';
import { PagePagination } from './common.dto';

export class CreateOrderItemDTO {
  @ApiProperty({
    type: String,
  })
  @IsMongoId()
  @IsNotEmpty()
  productItem: string;

  @ApiProperty({
    type: Number,
  })
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  price: number;

  @ApiProperty({
    type: Number,
  })
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  quantity: number;
}

export class CreateOrderDTO {
  @ApiProperty({
    type: String,
  })
  @IsMongoId()
  address: string;

  @ApiProperty({
    type: String,
    enum: PaymentMethod,
  })
  @IsNotEmpty()
  paymentMethod: PaymentMethod;

  @ApiProperty({
    type: Number,
  })
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  shippingFee: number;

  @ApiProperty({
    type: [CreateOrderItemDTO],
  })
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDTO)
  orderItems: CreateOrderItemDTO[];
}

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

export class QueryGetOrdersDashboard extends PagePagination {
  @ApiPropertyOptional({
    type: String,
  })
  @IsOptional()
  @IsMongoId()
  @IsNotEmpty()
  id: string;

  @ApiPropertyOptional({
    type: String,
  })
  @IsOptional()
  @IsDateString()
  from: string;

  @ApiPropertyOptional({
    type: String,
  })
  @IsOptional()
  @IsDateString()
  to: string;
}

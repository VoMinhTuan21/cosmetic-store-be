import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { PaymentMethod } from '../../constances/enum';

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

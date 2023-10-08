import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class UpdateShippingFeePeerKmDTO {
  @ApiProperty({ type: Number })
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  fee: number;
}

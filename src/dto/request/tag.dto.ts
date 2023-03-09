import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty } from 'class-validator';
import { CreateBrandDTO } from './brand.dto';

export class CreateTagDTO extends PickType(CreateBrandDTO, ['name'] as const) {}

export class UpdateTagDTO extends CreateTagDTO {
  @ApiProperty({ type: String })
  @IsMongoId()
  @IsNotEmpty()
  id: string;
}

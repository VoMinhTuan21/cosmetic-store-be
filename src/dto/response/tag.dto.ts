import { OmitType } from '@nestjs/swagger';

export class TagResDTO {
  _id: string;
  name: string;
  weight: number;
  parent: string;
}

export class TagGroupResDTO extends OmitType(TagResDTO, [
  'weight',
  'parent',
] as const) {}

export class TagTableResDTO extends OmitType(TagResDTO, ['parent'] as const) {}

export class TagGroupTableResDTO extends TagGroupResDTO {
  children: TagTableResDTO[];
}

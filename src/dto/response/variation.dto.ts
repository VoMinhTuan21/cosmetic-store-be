export class VariationResDTO {
  _id: string;
  name: ITranslate[];
}

export class VariationOptionResDTO {
  _id: string;
  value: ITranslate[];
}

export class VariationsTableResDTO {
  variation: VariationResDTO;
  variationOptions: VariationOptionResDTO[];
}

export class CategoryLeafDTO {
  _id: string;
  name: ITranslate[];
}

export class CategoryResDTO extends CategoryLeafDTO {
  children?: CategoryResDTO[];
  icon?: string;
}

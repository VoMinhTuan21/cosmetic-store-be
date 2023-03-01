export class CategoryLeafDTO {
  _id: string;
  name: ITranslate[];
}

export class CategoryResDTO extends CategoryLeafDTO {
  chilren?: CategoryResDTO[];
  icon?: string;
}

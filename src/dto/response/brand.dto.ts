export class BrandNameDTO {
  _id: string;
  name: string;
}

export class BrandResDTO extends BrandNameDTO {
  logo: string;
}

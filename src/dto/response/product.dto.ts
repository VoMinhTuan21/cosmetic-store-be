import { OmitType, PickType } from '@nestjs/swagger';

export class ProductDashboardTableDTO {
  _id: string;
  name: string;
  productItems: {
    _id: string;
    price: number;
    quantity: number;
    productConfigurations: {
      _id: string;
      value: string;
    }[];
  }[];
  brand: {
    _id: string;
    name: string;
  }[];
  categories: {
    _id: string;
    name: string;
  }[];
}

export class ProductSimPleDTO {
  _id: string;
  name: ITranslate[];
  description: ITranslate[];
  categories: string[];
  brand: string;
}

export class ProductCardDTO {
  productId: string;
  itemId: string;
  name: ITranslate[];
  // categories: string[];
  thumbnail: string;
  brand: string;
  price: number;
  rating: number;
  sold: number;
  comments: number;
}

export class SellingProductFollowTimeDTO extends PickType(ProductCardDTO, [
  'thumbnail',
  'productId',
  'itemId',
]) {
  name: string;
  sold: number;
}

// export class ProductBrandCartDTO extends OmitType(ProductCardDTO, [
//   'categories',
// ] as const) {}

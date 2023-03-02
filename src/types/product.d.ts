declare interface IProductItem {
  _id: string;
  price: number;
  quantity: number;
  productConfigurations: {
    _id: string;
    value: string;
  }[];
}

declare interface ICreateProduct {
  _id: string;
  name: string;
  brand: {
    _id: string;
    name: string;
  }[];
  categories: {
    _id: string;
    name: string;
  }[];
}

declare interface IProductItem {
  _id: string;
  price: number;
  quantity: number;
  thumbnail: string;
  images: string[];
  productConfigurations: {
    _id: string;
    value: string;
  }[];
}

declare interface IVariationList {
  _id: string;
  name: ITranslate[];
  values: {
    _id: string;
    value: ITranslate[];
  }[];
}

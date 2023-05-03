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
  productId: string;
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
  tags: {
    _id: string;
    name: string;
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

declare interface IRateCount {
  rate: number;
  count: number;
}

declare interface IBrandCount {
  brandId: string;
  count: number;
}

declare interface IProductSellCount {
  _id: string;
  count: number;
}

declare interface IMessengerCard {
  image: string;
  url: string;
  name: string;
}

declare interface IProductItemByCategory {
  _id: string;
  name: ITranslate[];
  productItems: {
    _id: string;
    thumbnail: string;
    productConfigurations: {
      _id: string;
      parentVariation: string;
      value: ITranslate[];
    }[];
    tags?: string[];
  };
}

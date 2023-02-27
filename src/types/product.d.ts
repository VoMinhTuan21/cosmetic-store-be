declare interface ICreatedProductItem {
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

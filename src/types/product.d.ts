declare interface ICreatedProductItem {
  _id: string;
  price: number;
  quantity: number;
  productConfigurations: {
    _id: string;
    value: string;
  }[];
}

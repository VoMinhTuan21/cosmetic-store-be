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
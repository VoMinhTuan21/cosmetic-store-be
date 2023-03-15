import { PaymentMethod } from '../../constances/enum';
import { AddressResDTO } from './user.dto';

export class OrderItemResDTO {
  _id: string;
  name: ITranslate[];
  quantity: number;
  price: number;
  thumbnail: string;
}

export class OrderResDTO {
  _id: string;
  date: string;
  orderItems: OrderItemResDTO[];
  shippingFee: number;
  paymentMethod: PaymentMethod;
}

export class OrderDetailResDTO extends OrderResDTO {
  address: AddressResDTO;
}

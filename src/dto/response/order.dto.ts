import { OmitType } from '@nestjs/swagger';
import { OrderStatus, PaymentMethod } from '../../constances/enum';
import { AddressResDTO } from './user.dto';

export class OrderItemClientResDTO {
  _id: string;
  name: ITranslate[];
  quantity: number;
  price: number;
  thumbnail: string;
  comment?: CommentRestDTO;
  configurations: ITranslate[][];
}

export class CommentRestDTO {
  _id: string;
  rate: number;
  content: string;
}

export class OrderItemAdminResDTO {
  _id: string;
  name: string;
  quantity: number;
  price: number;
  thumbnail: string;
  configurations: string[];
}

export class OrderResDTO {
  _id: string;
  date: string;
  orderItems: (OrderItemAdminResDTO | OrderItemClientResDTO)[];
  shippingFee: number;
  paymentMethod: PaymentMethod;
  orderId: string;
}

export class OrderDetailResDTO extends OrderResDTO {
  address: AddressResDTO;
  status: OrderStatus;
}

export class MomoPaymentRes {
  requestId: string;
  errorCode: number;
  message: string;
  localMessage: string;
  requestType: string;
  payUrl: string;
  qrCodeUrl: string;
  deeplink: string;
  deeplinkWebInApp: string;
  signature: string;
}

export class MomoConfirmPaymentRes {
  partnerCode: string;
  requestId: string;
  amount: number;
  transId: number;
  resultCode: number;
  message: string;
  requestType: string;
  responseTime: string;
}

export class OrderTableResDTO extends OmitType(OrderResDTO, [
  'orderItems',
  'shippingFee',
] as const) {
  total: number;
  orderId: string;
}

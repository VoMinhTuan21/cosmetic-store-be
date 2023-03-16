import { OmitType } from '@nestjs/swagger';
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
}

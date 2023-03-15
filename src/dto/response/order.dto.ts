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

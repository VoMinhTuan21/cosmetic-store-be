import { HttpService } from '@nestjs/axios';
import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MomoPaymentDTO } from '../../dto/request';
import {
  MomoConfirmPaymentRes,
  MomoPaymentRes,
} from '../../dto/response/order.dto';
import { Order, OrderDocument, OrderItemDocument } from '../../schemas';
import {
  handleResponseFailure,
  handleResponseSuccess,
} from '../../utils/handle-response';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Order.name)
    private readonly orderItemModel: Model<OrderItemDocument>,
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
  ) {}

  async createSignature(secretKey: string, rawSignature: string) {
    const { createHmac } = await import('crypto');
    const signature = createHmac('sha256', secretKey)
      .update(rawSignature)
      .digest('hex');

    return signature;
  }

  async paymentWithMomo() {
    try {
      const partnerCode = this.config.get('PARTNER_CODE');
      console.log('partnerCode: ', partnerCode);
      const accessKey = this.config.get('ACCESS_KEY');
      const secretKey = this.config.get('SECRET_KEY');
      const requestId = partnerCode + new Date().getTime();
      const orderId = requestId;
      const orderInfo = 'pay with MoMo';
      const redirectUrl = this.config.get('REDIRECT_URL');
      console.log('redirectUrl: ', redirectUrl);
      const ipnUrl = this.config.get('IPN_URL');
      const amount = '10000';
      const requestType = 'captureWallet';
      const extraData = '';
      const rawSignature =
        'accessKey=' +
        accessKey +
        '&amount=' +
        amount +
        '&extraData=' +
        extraData +
        '&ipnUrl=' +
        ipnUrl +
        '&orderId=' +
        orderId +
        '&orderInfo=' +
        orderInfo +
        '&partnerCode=' +
        partnerCode +
        '&redirectUrl=' +
        redirectUrl +
        '&requestId=' +
        requestId +
        '&requestType=' +
        requestType;
      const signature = await this.createSignature(secretKey, rawSignature);
      const requestBody = JSON.stringify({
        partnerCode: partnerCode,
        accessKey: accessKey,
        requestId: requestId,
        amount: amount,
        orderId: orderId,
        orderInfo: orderInfo,
        redirectUrl: redirectUrl,
        ipnUrl: ipnUrl,
        extraData: extraData,
        requestType: requestType,
        signature: signature,
        lang: 'en',
      });

      const response = await this.httpService.axiosRef.post<MomoPaymentRes>(
        this.config.get('MOMO_CREATE_PAYMENT_URL'),
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(requestBody),
          },
        },
      );

      return response.data.payUrl;
    } catch (error) {
      console.log('error: ', error);
    }
  }

  async confirmPayWithmomo(body: MomoPaymentDTO) {
    try {
      console.log('body: ', body);
    } catch (error) {
      console.log('error: ', error);
    }
  }
}

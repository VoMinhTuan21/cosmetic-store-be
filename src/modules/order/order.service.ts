import { HttpService } from '@nestjs/axios';
import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MomoPaymentDTO } from '../../dto/request';
import { MomoPaymentRes } from '../../dto/response/order.dto';
import {
  CREATE_ORDER_SUCCESS,
  USER_REJECT_PAY_WITH_MOMO,
  ERROR_CREATE_ORDER,
  ERROR_CREATE_ORDER_ITEM,
  ERROR_MAKE_PAYMENT_WITH_MOMO,
  ERROR_NOT_ENOUGH_QUANTITY_FOR_,
  PAYMENT_WITH_MOMO_SUCCESS,
  ERROR_CHECK_ORDER,
  CHECK_ORDER_SUCCESS,
} from '../../constances';
import { OrderStatus, PaymentMethod } from '../../constances/enum';
import { CreateOrderDTO, CreateOrderItemDTO } from '../../dto/request';
import {
  Order,
  OrderDocument,
  OrderItem,
  OrderItemDocument,
} from '../../schemas';
import {
  handleResponseFailure,
  handleResponseSuccess,
} from '../../utils/handle-response';
import { ProductService } from '../product/product.service';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    @InjectModel(OrderItem.name)
    private readonly orderItemModel: Model<OrderItemDocument>,
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
    private readonly productService: ProductService,
  ) {}

  async createSignature(secretKey: string, rawSignature: string) {
    const { createHmac } = await import('crypto');
    const signature = createHmac('sha256', secretKey)
      .update(rawSignature)
      .digest('hex');

    return signature;
  }

  async paymentWithMomo(orderId: string, amount: string) {
    try {
      const partnerCode = this.config.get('PARTNER_CODE');
      const accessKey = this.config.get('ACCESS_KEY');
      const secretKey = this.config.get('SECRET_KEY');
      const requestId = partnerCode + new Date().getTime();
      const orderInfo = 'thanh toán đơn hàng Hygge với Momo';
      const redirectUrl = this.config.get('REDIRECT_URL');
      const ipnUrl = this.config.get('IPN_URL');
      // const amount = '10000';
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
        lang: 'vi',
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
      if (body.resultCode !== 0) {
        console.log('body.resultCode: ', body.resultCode);
        const order = await this.orderModel.findByIdAndDelete(body.orderId);
        for (let i = 0; i < order.orderItems.length; i++) {
          const orderItem = order.orderItems[i];
          await this.orderItemModel.findByIdAndDelete(orderItem);
        }

        return handleResponseSuccess({
          data: body.orderId,
          message: USER_REJECT_PAY_WITH_MOMO,
        });
      }

      const order = await this.orderModel.findById(body.orderId);

      return handleResponseSuccess({
        data: '',
        message: PAYMENT_WITH_MOMO_SUCCESS,
      });
    } catch (error) {
      console.log('error: ', error);
    }
  }

  async createOrder(dto: CreateOrderDTO, user: string) {
    try {
      const orderItems: string[] = [];

      for (const item of dto.orderItems) {
        const isEnoughQuantity = await this.productService.checkEnoughQuantity(
          item.productItem,
          item.quantity,
        );

        if (!isEnoughQuantity) {
          return handleResponseFailure({
            error: `${ERROR_NOT_ENOUGH_QUANTITY_FOR_}${item.productItem}`,
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          });
        }
      }

      for (const item of dto.orderItems) {
        const id = await this.createOrderItem(item);
        if (id) {
          orderItems.push(id);
          await this.productService.subtractQuantity(
            item.productItem,
            item.quantity,
          );
        }
      }

      const order = await this.orderModel.create({
        user: user,
        address: dto.address,
        shippingFee: dto.shippingFee,
        paymentMethod: dto.paymentMethod,
        orderItems: orderItems,
        data: new Date(),
        status: OrderStatus.Pending,
      });

      if (order.paymentMethod === PaymentMethod.MOMO) {
        const totalPrice =
          dto.orderItems.reduce(
            (total, item) => (total = total + item.price * item.quantity),
            0,
          ) + dto.shippingFee;
        try {
          const momoPayUrl = await this.paymentWithMomo(
            order._id.toString(),
            totalPrice.toString(),
          );

          return handleResponseSuccess({
            data: momoPayUrl,
            message: CREATE_ORDER_SUCCESS,
          });
        } catch (error) {
          console.log('error: ', error);
          return handleResponseFailure({
            error: ERROR_MAKE_PAYMENT_WITH_MOMO,
            statusCode: HttpStatus.BAD_REQUEST,
          });
        }
      }

      return handleResponseSuccess({
        data: '',
        message: CREATE_ORDER_SUCCESS,
      });
    } catch (error) {
      console.log('error: ', error);
      return handleResponseFailure({
        error: error.response?.error || ERROR_CREATE_ORDER,
        statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
      });
    }
  }

  async createOrderItem(dto: CreateOrderItemDTO) {
    try {
      const item = await this.orderItemModel.create({
        productItem: dto.productItem,
        price: dto.price,
        quantity: dto.quantity,
      });

      return item._id;
    } catch (error) {
      return handleResponseFailure({
        error: ERROR_CREATE_ORDER_ITEM,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }
  }

  async checkOrder(orderId: string) {
    try {
      const order = await this.orderModel.findById(orderId);
      if (order) {
        return handleResponseSuccess({
          data: true,
          message: CHECK_ORDER_SUCCESS,
        });
      }

      return handleResponseSuccess({
        data: false,
        message: CHECK_ORDER_SUCCESS,
      });
    } catch (error) {
      console.log('error: ', error);
      return handleResponseFailure({
        error: ERROR_CHECK_ORDER,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }
  }
}

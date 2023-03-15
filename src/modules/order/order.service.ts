import { HttpService } from '@nestjs/axios';
import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
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
  ERROR_GET_ORDERS,
  ERROR_GET_ORDER_BY_ID,
  ERROR_MAKE_PAYMENT_WITH_MOMO,
  ERROR_NOT_ENOUGH_QUANTITY_FOR_,
  GET_ORDERS_SUCCESS,
  GET_ORDER_BY_ID_SUCCESS,
  PAYMENT_WITH_MOMO_SUCCESS,
  ERROR_CHECK_ORDER,
  CHECK_ORDER_SUCCESS,
} from '../../constances';
import { OrderStatus, PaymentMethod } from '../../constances/enum';
import { CreateOrderDTO, CreateOrderItemDTO } from '../../dto/request';
import {
  OrderDetailResDTO,
  OrderItemResDTO,
  OrderResDTO,
} from '../../dto/response';
import {
  AddressDocument,
  Order,
  OrderDocument,
  OrderItem,
  OrderItemDocument,
  VariationOptionDocument,
} from '../../schemas';
import {
  handleResponseFailure,
  handleResponseSuccess,
} from '../../utils/handle-response';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
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
    private readonly cloudinaryService: CloudinaryService,
    @InjectMapper() private readonly mapper: Mapper,
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

  async getOrders(type: OrderStatus, user: string) {
    try {
      const orders = await this.orderModel.find({ status: type, user: user });

      const result: OrderResDTO[] = [];

      for (const order of orders) {
        const data = await this.getOrderById(order._id, user);

        if (data) {
          result.push(
            this.mapper.map(data.data, OrderDetailResDTO, OrderResDTO),
          );
        }
      }

      return handleResponseSuccess({
        data: result,
        message: GET_ORDERS_SUCCESS,
      });
    } catch (error) {
      return handleResponseFailure({
        error: error.response?.error || ERROR_GET_ORDERS,
        statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
      });
    }
  }

  async getOrderById(orderId: string, user: string) {
    try {
      const order = await this.orderModel
        .findOne({ _id: orderId, user: user })
        .populate({
          path: 'orderItems',
        })
        .populate({ path: 'address', select: '-updatedAt -createdAt' });

      const orderItems: OrderItemResDTO[] = [];

      for (const orderItem of order.orderItems as OrderItemDocument[]) {
        const product = await this.productService.getProductByProductItemId(
          orderItem.productItem as string,
        );

        const productItem = await this.productService.getProductItemById(
          orderItem.productItem as string,
        );

        let nameVi = '';
        let nameEn = '';

        product.name.forEach((item) => {
          if (item.language === 'vi') {
            nameVi = item.value;
          } else if (item.language === 'en') {
            nameEn = item.value;
          }
        });

        for (const item of productItem.productConfigurations as VariationOptionDocument[]) {
          item.value.forEach((e) => {
            if (e.language === 'vi') {
              nameVi = `${nameVi} ${e.value}`;
            } else {
              nameEn = `${nameEn} ${e.value}`;
            }
          });
        }

        orderItems.push({
          _id: orderItem.productItem as string,
          name: [
            {
              language: 'vi',
              value: nameVi,
            },
            {
              language: 'en',
              value: nameEn,
            },
          ],
          thumbnail: await this.cloudinaryService.getImageUrl(
            productItem.thumbnail,
          ),
          price: orderItem.price,
          quantity: orderItem.quantity,
        });
      }

      const address = order.address as AddressDocument;

      const result: OrderDetailResDTO = {
        _id: order._id,
        date: order.createdAt as string,
        orderItems: orderItems,
        paymentMethod: order.paymentMethod,
        shippingFee: order.shippingFee,
        address: {
          _id: address._id,
          coordinates: address.coordinates,
          default: address.default,
          district: address.district,
          name: address.name,
          phone: address.phone,
          province: address.province,
          specificAddress: address.specificAddress,
          ward: address.ward,
        },
      };

      return handleResponseSuccess({
        data: result,
        message: GET_ORDER_BY_ID_SUCCESS,
      });
    } catch (error) {
      console.log('error: ', error);
      return handleResponseFailure({
        error: ERROR_GET_ORDER_BY_ID,
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

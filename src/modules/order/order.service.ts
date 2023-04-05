import { HttpService } from '@nestjs/axios';
import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MomoPaymentDTO, QueryGetOrdersDashboard } from '../../dto/request';
import {
  MomoPaymentRes,
  MomoRefundRes,
  OrderItemAdminResDTO,
  OrderTableResDTO,
} from '../../dto/response/order.dto';
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
  ERROR_UPDATE_ORDER_STATUS,
  ERROR_ORDER_NOT_FOUND,
  ERROR_CAN_NOT_UPDATE_ORDER_STATUS,
  UPDATE_ORDER_STATUS_SUCCESS,
  GET_ORDERS_TABLE_DASHBOARD_SUCCESS,
  ERROR_GET_ORDERS_TABLE_DASHBOARD,
  ERROR_REFUND_PAYMENT_WITH_MOMO_ORDER,
  ERROR_CAN_NOT_REFUND_COD_PAYMENT_METHOD,
  REFUND_PAYMENT_WITH_MOMO_SUCCESS,
} from '../../constances';
import { OrderStatus, PaymentMethod } from '../../constances/enum';
import { CreateOrderDTO, CreateOrderItemDTO } from '../../dto/request';
import {
  OrderDetailResDTO,
  OrderItemClientResDTO,
  OrderResDTO,
} from '../../dto/response';
import {
  AddressDocument,
  CommentDocument,
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
import { generateOrderId } from '../../utils/random-string';
import { compareBrandCount } from '../../utils/array';

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

  async confirmPayWithMomo(body: MomoPaymentDTO) {
    try {
      if (body.resultCode !== 0) {
        console.log('body.resultCode: ', body.resultCode);
        const order = await this.orderModel.findByIdAndDelete(body.orderId);
        for (let i = 0; i < order.orderItems.length; i++) {
          const orderItem = order.orderItems[i];

          const delOrderItem = await this.orderItemModel.findByIdAndDelete(
            orderItem,
          );

          await this.productService.addProductItemQuantity(
            delOrderItem.productItem as string,
            delOrderItem.quantity,
          );
        }

        return handleResponseSuccess({
          data: body.orderId,
          message: USER_REJECT_PAY_WITH_MOMO,
        });
      }

      const order = await this.orderModel.findById(body.orderId);
      order.transId = body.transId;
      await order.save();

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
        orderId: generateOrderId(),
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
      const orders = await this.orderModel
        .find({ status: type, user: user })
        .sort({ createdAt: -1 });

      const result: OrderResDTO[] = [];

      for (const order of orders) {
        const data = await this.getOrderById(order._id, false, user);

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

  async getOrderById(orderId: string, admin: boolean, user?: string) {
    try {
      let query: { [index: string]: any } = {};

      if (orderId) {
        if (orderId.length === 14) {
          query = { orderId: orderId };
        } else {
          query = { _id: orderId };
        }
      }

      if (!admin && user) {
        query = {
          user: user,
          ...query,
        };
      }

      const order = await this.orderModel
        .findOne(query)
        .populate({
          path: 'orderItems',
        })
        .populate({ path: 'address', select: '-updatedAt -createdAt' });

      const orderItems: (OrderItemAdminResDTO | OrderItemClientResDTO)[] = [];

      for (const orderItem of order.orderItems as OrderItemDocument[]) {
        let orderItemDetail: OrderItemAdminResDTO | OrderItemClientResDTO;
        if (admin) {
          orderItemDetail = await this.getOrderItemDetailAdmin(orderItem);
        } else {
          orderItemDetail = await this.getOrderItemDetailClient(orderItem);
        }
        orderItems.push(orderItemDetail);
      }

      const address = order.address as AddressDocument;

      const result: OrderDetailResDTO = {
        _id: order._id,
        orderId: order.orderId,
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
        status: order.status,
        refund: order.refund,
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

  async getOrderItemDetailClient(orderItem: OrderItemDocument) {
    const product = await this.productService.getProductByProductItemId(
      orderItem.productItem as string,
    );

    const productItem = await this.productService.getProductItemById(
      orderItem.productItem as string,
    );

    const comment = (productItem.comments as CommentDocument[]).find(
      (item) => item.orderItem.toString() === orderItem._id.toString(),
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

    const orderItemDetail: OrderItemClientResDTO = {
      _id: orderItem._id,
      productItemId: productItem._id,
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
      configurations: (
        productItem.productConfigurations as VariationOptionDocument[]
      ).map((varia) => varia.value),
      comment: comment && {
        _id: comment._id,
        rate: comment.rate,
        content: comment.content,
      },
    };

    return orderItemDetail;
  }

  async getOrderItemDetailAdmin(orderItem: OrderItemDocument) {
    const product = await this.productService.getProductByProductItemId(
      orderItem.productItem as string,
    );

    const productItem = await this.productService.getProductItemById(
      orderItem.productItem as string,
    );

    let nameVi = '';

    product.name.forEach((item) => {
      if (item.language === 'vi') {
        nameVi = item.value;
      }
    });

    for (const item of productItem.productConfigurations as VariationOptionDocument[]) {
      item.value.forEach((e) => {
        if (e.language === 'vi') {
          nameVi = `${nameVi} ${e.value}`;
        }
      });
    }

    const orderItemDetail: OrderItemAdminResDTO = {
      _id: orderItem._id,
      name: nameVi,
      thumbnail: await this.cloudinaryService.getImageUrl(
        productItem.thumbnail,
      ),
      price: orderItem.price,
      quantity: orderItem.quantity,
      configurations: (
        productItem.productConfigurations as VariationOptionDocument[]
      ).map(
        (varia) =>
          varia.value.filter((item) => item.language === 'vi')[0].value,
      ),
    };

    return orderItemDetail;
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

  async takeProductBackFromOrder(orderId: string) {
    const order = await this.orderModel.findById(orderId);
    for (let i = 0; i < order.orderItems.length; i++) {
      const orderItemId = order.orderItems[i];

      const orderItem = await this.orderItemModel.findById(orderItemId);

      await this.productService.addProductItemQuantity(
        orderItem.productItem as string,
        orderItem.quantity,
      );
    }
  }

  async updateOrderStatus(orderId: string, status: OrderStatus) {
    try {
      const order = await this.orderModel.findById(orderId);
      if (!order) {
        return handleResponseFailure({
          error: ERROR_ORDER_NOT_FOUND,
          statusCode: HttpStatus.NOT_FOUND,
        });
      }

      if (order.status === OrderStatus.Pending) {
        if (
          status === OrderStatus.Delivering ||
          status === OrderStatus.Cancelled
        ) {
          order.status = status;
          await order.save();

          if (status === OrderStatus.Cancelled) {
            await this.takeProductBackFromOrder(orderId);
          }
        } else {
          return handleResponseFailure({
            error: ERROR_CAN_NOT_UPDATE_ORDER_STATUS,
            statusCode: HttpStatus.BAD_REQUEST,
          });
        }
      } else if (order.status === OrderStatus.Delivering) {
        if (
          status === OrderStatus.Completed ||
          status === OrderStatus.NotAcceptOrder
        ) {
          order.status = status;
          await order.save();
        } else {
          return handleResponseFailure({
            error: ERROR_CAN_NOT_UPDATE_ORDER_STATUS,
            statusCode: HttpStatus.BAD_REQUEST,
          });
        }
      } else {
        return handleResponseFailure({
          error: ERROR_CAN_NOT_UPDATE_ORDER_STATUS,
          statusCode: HttpStatus.BAD_REQUEST,
        });
      }

      return handleResponseSuccess({
        message: UPDATE_ORDER_STATUS_SUCCESS,
        data: {
          orderId,
          status,
        },
      });
    } catch (error) {
      console.log('error: ', error);
      return handleResponseFailure({
        error: error.response?.error || ERROR_UPDATE_ORDER_STATUS,
        statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
      });
    }
  }

  async getOrdresDashboard(type: OrderStatus, query: QueryGetOrdersDashboard) {
    try {
      let condition: { [index: string]: any } = {
        status: type,
      };

      if (query.id) {
        condition = {
          orderId: query.id,
          ...condition,
        };
      }
      if (query.from) {
        condition = {
          createdAt: {
            $gte: new Date(query.from),
          },
          ...condition,
        };
      }
      if (query.to) {
        condition = {
          createdAt: {
            $lte: new Date(query.to),
          },
          ...condition,
        };
      }

      const orders = await this.orderModel
        .find(condition)
        .sort({ createdAt: -1 });

      const result: OrderTableResDTO[] = [];

      for (const order of orders) {
        const data = await this.getOrderById(order._id, true);
        if (data) {
          result.push(
            this.mapper.map(data.data, OrderResDTO, OrderTableResDTO),
          );
        }
      }

      return handleResponseSuccess({
        data: {
          data: result.slice(
            query.page * query.limit,
            query.page * query.limit + query.limit,
          ),
          total: result.length,
        },
        message: GET_ORDERS_TABLE_DASHBOARD_SUCCESS,
      });
    } catch (error) {
      return handleResponseFailure({
        error: error.response?.error || ERROR_GET_ORDERS_TABLE_DASHBOARD,
        statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
      });
    }
  }

  async refundPaymentWithMomo(orderId: string) {
    try {
      const order = await this.orderModel
        .findById(orderId)
        .populate('orderItems');
      if (!order) {
        return handleResponseFailure({
          error: ERROR_ORDER_NOT_FOUND,
          statusCode: HttpStatus.NOT_FOUND,
        });
      }

      if (order.paymentMethod === PaymentMethod.COD) {
        return handleResponseFailure({
          error: ERROR_CAN_NOT_REFUND_COD_PAYMENT_METHOD,
          statusCode: HttpStatus.BAD_REQUEST,
        });
      }

      const totalProdPrice = (order.orderItems as OrderItemDocument[]).reduce(
        (total, currOrderItem) =>
          total + currOrderItem.quantity * currOrderItem.price,
        0,
      );

      let refundAmount = totalProdPrice;

      if (order.status === OrderStatus.Cancelled) {
        refundAmount += order.shippingFee;
      }

      const partnerCode = this.config.get('PARTNER_CODE');
      const accessKey = this.config.get('ACCESS_KEY');
      const secretKey = this.config.get('SECRET_KEY');
      const requestId = partnerCode + new Date().getTime();
      console.log('requestId: ', requestId);
      const description = `Hoàn tiền cho đơn hàng ${order.orderId}`;

      const rawSignature =
        'accessKey=' +
        accessKey +
        '&amount=' +
        refundAmount +
        '&description=' +
        description +
        '&orderId=' +
        requestId +
        '&partnerCode=' +
        partnerCode +
        '&requestId=' +
        requestId +
        '&transId=' +
        order.transId;

      const signature = await this.createSignature(secretKey, rawSignature);

      const requestBody = JSON.stringify({
        partnerCode: partnerCode,
        orderId: requestId,
        requestId: requestId,
        amount: refundAmount,
        transId: order.transId,
        lang: 'vi',
        description: description,
        signature: signature,
      });

      const response = await this.httpService.axiosRef.post<MomoRefundRes>(
        this.config.get('MOMO_REFUND_ONLINE_PAYMENT'),
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(requestBody),
          },
        },
      );

      console.log('response.data.message: ', response.data.message);
      if (response.data.resultCode !== 0) {
        return handleResponseFailure({
          error: ERROR_REFUND_PAYMENT_WITH_MOMO_ORDER,
          statusCode: HttpStatus.BAD_REQUEST,
        });
      }

      order.refund = true;
      await order.save();

      return handleResponseSuccess({
        message: REFUND_PAYMENT_WITH_MOMO_SUCCESS,
        data: orderId,
      });
    } catch (error) {
      console.log('error: ', error);
      return handleResponseFailure({
        error: ERROR_REFUND_PAYMENT_WITH_MOMO_ORDER,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }
  }

  async getNumberItemSellInBrands() {
    const orderItems = (await this.orderItemModel.aggregate([
      {
        $group: {
          _id: '$productItem',
          count: { $count: {} },
        },
      },
    ])) as IProductSellCount[];

    const brandCount: IBrandCount[] = [];

    for (let i = 0; i < orderItems.length; i++) {
      const prodSellItem = orderItems[i];

      const brandProd = await this.productService.getProdBrandByProdItemId(
        prodSellItem._id as string,
      );

      const existBrand = brandCount.find(
        (brand) => brand.brandId === brandProd.toString(),
      );

      if (existBrand) {
        existBrand.count += prodSellItem.count;
      } else {
        brandCount.push({
          brandId: brandProd.toString(),
          count: prodSellItem.count,
        });
      }
    }

    return brandCount
      .sort(compareBrandCount)
      .slice(0, 15)
      .map((brand) => brand.brandId);
  }
}

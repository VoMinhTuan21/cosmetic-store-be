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
  ERROR_GET_ORDER_REVENUE_FOLLOW_TIME,
  GET_ORDER_REVENUE_FOLLOW_TIME_SUCCESS,
  ERROR_GET_ORDER_OVERVIEW,
  GET_ORDER_OVERVIEW_SUCCESS,
  ERROR_GET_ORDER_REPORT_DAILY,
  GET_ORDER_REPORT_DAILY_SUCCESS,
} from '../../constances';
import {
  OrderStatus,
  PaymentMethod,
  OrderTimeReport,
} from '../../constances/enum';
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
import { UserService } from '../user/user.service';
import { SalesQuantityService } from '../sales-quantity/sales-quantity.service';
import { addDays, subtractDays } from '../../utils/date';

const positive = [
  'Sản phẩm đến nhanh chóng và chất lượng tuyệt vời.',
  'Tôi rất hài lòng với chất lượng sản phẩm và dịch vụ của bạn.',
  'Sản phẩm hoàn toàn như mô tả trên trang web và đáng giá tiền bỏ ra.',
  'Tôi đã mua sản phẩm này cho người thân và họ rất thích nó.',
  'Tôi sẽ quay lại mua sản phẩm của bạn trong tương lai.',
  'Sản phẩm rất đẹp và chất lượng tốt hơn cả những gì tôi mong đợi.',
  'Giao hàng rất nhanh và sản phẩm được đóng gói cẩn thận.',
  'Tôi đã mua sản phẩm này và đã giới thiệu cho bạn bè của tôi.',
  'Sản phẩm rất tiện lợi và đáng giá để đầu tư.',
  'Tôi rất cảm kích về dịch vụ khách hàng của bạn, họ rất nhiệt tình và thân thiện.',
  'Sản phẩm chất lượng và giá cả phải chăng.',
  'Tôi rất hài lòng với trải nghiệm mua sắm của mình trên trang web của bạn.',
  'Sản phẩm đáp ứng được tất cả những gì tôi mong đợi và tôi rất vui vì đã mua nó.',
  'Giao hàng rất nhanh và sản phẩm được đóng gói rất chắc chắn.',
  'Tôi đã mua sản phẩm này cho bản thân và tôi yêu nó.',
  'Sản phẩm rất đẹp và chất lượng tốt, đáng giá để mua.',
  'Tôi đã mua sản phẩm này cho người thân và họ rất thích nó.',
  'Tôi sẽ giới thiệu sản phẩm này cho những người khác và mua nó trở lại.',
  'Tôi đã mua sản phẩm này và tôi rất hài lòng với chất lượng và giá cả.',
  'Sản phẩm rất tốt và đáng giá để đầu tư, tôi sẽ mua nó lần nữa.',
];

const negative = [
  'Sản phẩm đến tay tôi bị hỏng, không giống như hình ảnh trên website.',
  'Giao hàng quá chậm, tôi đã phải chờ đợi hơn 2 tuần để sản phẩm đến.',
  'Thiết kế sản phẩm rất tệ, tôi không thể sử dụng được như mong đợi.',
  'Chất lượng sản phẩm rất kém, tôi đã phải đền bù thêm chi phí để sửa chữa.',
  'Tôi đã nhận được sản phẩm không đúng với mô tả trên website.',
  'Sản phẩm bị vỡ khi đến tay tôi, do không được đóng gói cẩn thận.',
  'Dịch vụ khách hàng rất tồi, tôi đã phải chờ đợi quá lâu để được giải quyết vấn đề của mình.',
  'Sản phẩm không hoạt động như quảng cáo, tôi đã phải trả lại sản phẩm và đòi lại tiền.',
  'Tôi đã nhận được sản phẩm đã qua sử dụng, rất thất vọng về chất lượng dịch vụ.',
  'Sản phẩm không đúng kích thước như tôi đã đặt trên website.',
  'Tôi đã nhận được sản phẩm sai màu sắc so với mô tả trên website.',
  'Sản phẩm không đáp ứng được yêu cầu của tôi, tôi đã phải trả lại và tìm mua sản phẩm khác.',
  'Tôi đã nhận được sản phẩm bị hỏng, nhưng không được hỗ trợ đổi trả từ nhà bán hàng.',
  'Sản phẩm đến quá trễ, tôi đã phải mua sản phẩm khác ở cửa hàng để đáp ứng nhu cầu của mình.',
  'Tôi đã nhận được sản phẩm không đầy đủ phụ kiện như mô tả trên website.',
  'Dịch vụ giao hàng rất tệ, nhân viên giao hàng không thân thiện và không chuyên nghiệp.',
  'Sản phẩm bị lỗi kỹ thuật, tôi đã phải đưa sản phẩm đến cửa hàng để sửa chữa.',
  'Sản phẩm bị lỗi kỹ thuật, tôi đã phải đưa sản phẩm đến cửa hàng để sửa chữa.',
  'Sản phẩm không đúng với giá tiền tôi đã thanh toán.',
  'Tôi đã nhận được sản phẩm rất khác so với hình ảnh trên website, rất thất vọng.',
];

const normal = [
  'Sản phẩm này khá ổn định, tuy nhiên không có gì đặc biệt.',
  'Tôi cảm thấy sản phẩm này đáng giá với giá tiền mà tôi đã bỏ ra.',
  'Sản phẩm này không gây kích ứng da, tuy nhiên hiệu quả không được như tôi mong đợi.',
  'Tôi không thể nói rằng sản phẩm này là tốt nhất, nhưng cũng không phải là tệ.',
  'Đó là sản phẩm mỹ phẩm tốt, tuy nhiên giá cả hơi cao đối với tôi.',
  'Sản phẩm này hoàn toàn phù hợp với nhu cầu của tôi, tuy nhiên không có nhiều lựa chọn về màu sắc.',
  'Tôi đánh giá sản phẩm này là trung bình, không có gì đặc sắc và cũng không có điểm tồi.',
  'Sản phẩm này không gây kích ứng da nhưng tôi không thấy hiệu quả như tôi kỳ vọng.',
  'Tôi thấy sản phẩm này không có gì đặc biệt, nhưng cũng không có gì xấu.',
  'Sản phẩm này có mùi thơm dễ chịu, tuy nhiên không có hiệu quả đáng kể.',
  'Tôi sử dụng sản phẩm này trong một thời gian dài và tôi cảm thấy rất hài lòng với nó.',
  'Đây là sản phẩm mỹ phẩm tốt nhất mà tôi từng dùng.',
  'Tôi không thấy sản phẩm này đáng giá với giá tiền của nó.',
  'Sản phẩm này hoạt động tốt, tuy nhiên tôi thấy mùi hơi khó chịu.',
  'Tôi thấy sản phẩm này không có hiệu quả và cũng không đáng giá với giá tiền của nó.',
  'Đây là sản phẩm mỹ phẩm thông thường, không có gì đặc biệt nhưng cũng không có vấn đề gì.',
  'Sản phẩm này đáp ứng nhu cầu của tôi, tuy nhiên không có gì đặc biệt để nói về nó.',
  'Tôi thấy sản phẩm này khá đáng giá với giá tiền của nó.',
  'Sản phẩm này không có mùi hương quá mạnh và không gây kích ứng da, tuy nhiên tôi không thấy hiệu quả rõ rệt.',
  'Tôi không thấy sản phẩm này đáng giá với giá tiền và tôi sẽ không mua lại nó.',
];

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
    private readonly userService: UserService,
    private readonly salesQuantityService: SalesQuantityService,
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

      const salesQuantityId =
        await this.productService.getSalesQuantityByProductId(dto.productItem);
      await this.salesQuantityService.update(
        salesQuantityId.toString(),
        dto.quantity,
      );

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

  // async createOrderSample(dto: CreateOrderDTO, user: string) {
  //   try {
  //     const orderItems: string[] = [];

  //     // for (const item of dto.orderItems) {
  //     //   const isEnoughQuantity = await this.productService.checkEnoughQuantity(
  //     //     item.productItem,
  //     //     item.quantity,
  //     //   );

  //     //   if (!isEnoughQuantity) {
  //     //     return handleResponseFailure({
  //     //       error: `${ERROR_NOT_ENOUGH_QUANTITY_FOR_}${item.productItem}`,
  //     //       statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
  //     //     });
  //     //   }
  //     // }

  //     for (const item of dto.orderItems) {
  //       const id = await this.createOrderItem(item);
  //       if (id) {
  //         orderItems.push(id);
  //         // await this.productService.subtractQuantity(
  //         //   item.productItem,
  //         //   item.quantity,
  //         // );
  //       }
  //     }

  //     const order = await this.orderModel.create({
  //       user: user,
  //       address: dto.address,
  //       shippingFee: dto.shippingFee,
  //       paymentMethod: dto.paymentMethod,
  //       orderItems: orderItems,
  //       status: OrderStatus.Completed,
  //       orderId: generateOrderId(),
  //     });

  //     // if (order.paymentMethod === PaymentMethod.MOMO) {
  //     //   const totalPrice =
  //     //     dto.orderItems.reduce(
  //     //       (total, item) => (total = total + item.price * item.quantity),
  //     //       0,
  //     //     ) + dto.shippingFee;
  //     //   try {
  //     //     const momoPayUrl = await this.paymentWithMomo(
  //     //       order._id.toString(),
  //     //       totalPrice.toString(),
  //     //     );

  //     //     return handleResponseSuccess({
  //     //       data: momoPayUrl,
  //     //       message: CREATE_ORDER_SUCCESS,
  //     //     });
  //     //   } catch (error) {
  //     //     console.log('error: ', error);
  //     //     return handleResponseFailure({
  //     //       error: ERROR_MAKE_PAYMENT_WITH_MOMO,
  //     //       statusCode: HttpStatus.BAD_REQUEST,
  //     //     });
  //     //   }
  //     // }

  //     return handleResponseSuccess({
  //       data: order._id,
  //       message: CREATE_ORDER_SUCCESS,
  //     });
  //   } catch (error) {
  //     console.log('error: ', error);
  //     return handleResponseFailure({
  //       error: error.response?.error || ERROR_CREATE_ORDER,
  //       statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
  //     });
  //   }
  // }

  // async createTempOrders() {
  //   const userIds = await this.userService.getUsersTemp();

  //   for (const user of userIds) {
  //     const producItems = await this.productService.ramdomProdutItem();
  //     const response = await this.createOrderSample(
  //       {
  //         address: '642aee62d8434479d5e1dc0b',
  //         orderItems: producItems.map((item) => ({
  //           productItem: item.id,
  //           quantity: 1,
  //           price: item.price,
  //         })),
  //         paymentMethod: PaymentMethod.COD,
  //         shippingFee: 25000,
  //       },
  //       user,
  //     );

  //     if (response) {
  //       await this.commentSamples(response.data);
  //     }
  //   }

  //   return 'success';
  // }

  // async commentSamples(id: string) {
  //   const order = await this.orderModel.findById(id);
  //   for (const item of order.orderItems) {
  //     const orderItem = await this.orderItemModel.findById(item);

  //     const rating = Math.floor(Math.random() * 4 + 2);
  //     let content = '';

  //     if (rating < 3) {
  //       content = negative[Math.floor(Math.random() * negative.length)];
  //     } else if (rating > 3) {
  //       content = positive[Math.floor(Math.random() * positive.length)];
  //     } else {
  //       content = normal[Math.floor(Math.random() * normal.length)];
  //     }

  //     await this.productService.createComment(
  //       {
  //         orderItemId: orderItem._id,
  //         productItemId: orderItem.productItem.toString(),
  //         rate: rating,
  //         content,
  //       },
  //       order.user.toString(),
  //     );
  //   }
  // }

  // async createDataSalesQuantity() {
  //   const orderItems = (await this.orderItemModel.aggregate([
  //     {
  //       $group: {
  //         _id: '$productItem',
  //         sum: {
  //           $sum: '$quantity',
  //         },
  //       },
  //     },
  //   ])) as { _id: string; sum: number }[];
  //   for (const item of orderItems) {
  //     const salesQuantity = await this.salesQuantityService.create({
  //       sold: item.sum,
  //     });

  //     await this.productService.addSalesQuantityToProductItem(
  //       item._id,
  //       salesQuantity,
  //     );
  //   }

  //   return 'success';
  // }
}

    return brandCount
      .sort(compareBrandCount)
      .slice(0, 15)
      .map((brand) => brand.brandId);
  }

  async getOrdersRevenueOrRefundFollowTime(
    timeReport: OrderTimeReport,
    status: OrderStatus,
  ) {
    try {
      let query: { [index: string]: any } = {};
      if (timeReport === 'month') {
        const firstDayOfYear = new Date(new Date().getFullYear(), 0, 1);
        const lastDayOfYear = new Date(new Date().getFullYear(), 11, 31);
        query = {
          createdAt: { $gte: firstDayOfYear, $lte: lastDayOfYear },
        };
      } else if (timeReport === 'week') {
        const today = new Date();
        const aWeekAgo = subtractDays(today, 6);
        query = {
          createdAt: { $gte: aWeekAgo, $lte: today },
        };
      }

      if (status === OrderStatus.NotAcceptOrder) {
        query = {
          ...query,
          paymentMethod: 'MOMO',
          refund: true,
        };
      }

      const orders: IOrderRevenue[] = await this.orderModel.aggregate([
        {
          $match: {
            status: status,
            ...query,
          },
        },
        {
          $lookup: {
            from: 'orderitems',
            localField: 'orderItems',
            foreignField: '_id',
            as: 'orderItems',
          },
        },
        {
          $unwind: '$orderItems',
        },
        {
          $group: {
            _id: '$_id',
            totalPrice: {
              $sum: {
                $multiply: ['$orderItems.price', '$orderItems.quantity'],
              },
            },
            createdAt: { $first: '$createdAt' },
          },
        },
      ]);

      if (timeReport === 'month') {
        const monthRevenue: IRevenueValue[] = [];

        for (let month = 0; month < 12; month++) {
          const monthOrderRevenue = orders.reduce((monthTotal, currOrder) => {
            if (currOrder.createdAt.getMonth() === month) {
              return monthTotal + currOrder.totalPrice;
            }
            return monthTotal;
          }, 0);
          monthRevenue.push({
            label: (month + 1).toString(),
            value: monthOrderRevenue,
          });
        }

        return handleResponseSuccess({
          data: monthRevenue,
          message: GET_ORDER_REVENUE_FOLLOW_TIME_SUCCESS,
        });
      } else if (timeReport === 'week') {
        const weekRevenue: IRevenueValue[] = [];
        const today = new Date();

        for (let day = 0; day < 7; day++) {
          const date = subtractDays(today, day);
          console.log('date: ', date.getDate());
          const dateTotalRevenue = orders.reduce((total, currOrder) => {
            if (currOrder.createdAt.getDate() === date.getDate()) {
              return total + currOrder.totalPrice;
            }
            return total;
          }, 0);
          console.log('dateTotalRevenue: ', dateTotalRevenue);
          weekRevenue.push({
            value: dateTotalRevenue,
            label:
              date.getDate().toString() +
              '/' +
              (date.getMonth() + 1).toString(),
          });
        }

        return handleResponseSuccess({
          data: weekRevenue,
          message: GET_ORDER_REVENUE_FOLLOW_TIME_SUCCESS,
        });
      }
    } catch (error) {
      console.log('error: ', error);
      return handleResponseFailure({
        error: ERROR_GET_ORDER_REVENUE_FOLLOW_TIME,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }
  }

  async getOrderOverviewFollowTime(revenueTime: OrderTimeReport) {
    try {
      let query: { [index: string]: any } = {};
      if (revenueTime === 'month') {
        const firstDayOfYear = new Date(new Date().getFullYear(), 0, 1);
        const lastDayOfYear = new Date(new Date().getFullYear(), 11, 31);
        query = {
          createdAt: { $gte: firstDayOfYear, $lte: lastDayOfYear },
        };
      } else if (revenueTime === 'week') {
        const today = new Date();
        const aWeekAgo = subtractDays(today, 6);
        query = {
          createdAt: { $gte: aWeekAgo, $lte: today },
        };
      }

      const orderOverview: IOrderOverview[] = await this.orderModel.aggregate([
        {
          $match: {
            ...query,
          },
        },
        {
          $group: {
            _id: '$status',
            count: { $count: {} },
          },
        },
      ]);

      const orderOverviewRes: IOrderOverviewRes[] = [];

      for (let status in OrderStatus) {
        const orderStatusCount = orderOverview.find(
          (item) => item._id.toLowerCase() == status.toLowerCase(),
        );
        if (orderStatusCount) {
          orderOverviewRes.push({
            status,
            count: orderStatusCount.count,
          });
        } else {
          orderOverviewRes.push({
            status,
            count: 0,
          });
        }
      }

      return handleResponseSuccess({
        message: GET_ORDER_OVERVIEW_SUCCESS,
        data: orderOverviewRes,
      });
    } catch (error) {
      console.log('error: ', error);
      return handleResponseFailure({
        error: ERROR_GET_ORDER_OVERVIEW,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }
  }

  async getOrderDailyReport() {
    try {
      const today = new Date();
      const startToday = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      );
      const tomorrow = addDays(startToday, 1);

      const ordersToday = await this.orderModel
        .find({
          createdAt: {
            $gte: startToday,
            $lt: tomorrow,
          },
        })
        .count();

      const cancelledOrdersToday = await this.orderModel
        .find({
          status: 'cancelled',
          createdAt: {
            $gte: startToday,
            $lt: tomorrow,
          },
        })
        .count();

      // find and calculate total revenue of completed order on today
      const ordersCompletedToday: IOrderRevenue[] =
        await this.orderModel.aggregate([
          {
            $match: {
              status: 'completed',
              createdAt: {
                $gte: startToday,
                $lt: tomorrow,
              },
            },
          },
          {
            $lookup: {
              from: 'orderitems',
              localField: 'orderItems',
              foreignField: '_id',
              as: 'orderItems',
            },
          },
          {
            $unwind: '$orderItems',
          },
          {
            $group: {
              _id: '$_id',
              totalPrice: {
                $sum: {
                  $multiply: ['$orderItems.price', '$orderItems.quantity'],
                },
              },
              createdAt: { $first: '$createdAt' },
            },
          },
        ]);

      const totalRevenueToday = ordersCompletedToday.reduce(
        (total, order) => total + order.totalPrice,
        0,
      );

      return handleResponseSuccess({
        message: GET_ORDER_REPORT_DAILY_SUCCESS,
        data: {
          numOfOrders: ordersToday,
          numOfCancelledOrders: cancelledOrdersToday,
          numOfCompletedOrders: ordersCompletedToday.length,
          totalRevenueToday,
        },
      });
    } catch (error) {
      console.log('error: ', error);
      return handleResponseFailure({
        error: ERROR_GET_ORDER_REPORT_DAILY,
        statusCode: HttpStatus.BAD_GATEWAY,
      });
    }
  }
}

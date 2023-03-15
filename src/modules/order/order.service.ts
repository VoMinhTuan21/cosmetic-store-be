import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  CREATE_ORDER_SUCCESS,
  ERROR_CREATE_ORDER,
  ERROR_CREATE_ORDER_ITEM,
  ERROR_GET_ORDERS,
  ERROR_GET_ORDER_BY_ID,
  ERROR_NOT_ENOUGH_QUANTITY_FOR_,
  GET_ORDERS_SUCCESS,
  GET_ORDER_BY_ID_SUCCESS,
} from '../../constances';
import { OrderStatus } from '../../constances/enum';
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
    private readonly productService: ProductService,
    private readonly cloudinaryService: CloudinaryService,
    @InjectMapper() private readonly mapper: Mapper,
  ) {}

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

      return handleResponseSuccess({
        data: CREATE_ORDER_SUCCESS,
        message: CREATE_ORDER_SUCCESS,
      });
    } catch (error) {
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
}

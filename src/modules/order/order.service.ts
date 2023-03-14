import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  CREATE_ORDER_SUCCESS,
  ERROR_CREATE_ORDER,
  ERROR_CREATE_ORDER_ITEM,
  ERROR_NOT_ENOUGH_QUANTITY_FOR_,
} from '../../constances';
import { OrderStatus } from '../../constances/enum';
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
    private readonly productService: ProductService,
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
        data: new Date(),
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
}

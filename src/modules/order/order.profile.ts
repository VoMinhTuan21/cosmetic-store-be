import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { createMap, forMember, Mapper, mapFrom } from '@automapper/core';
import { Injectable } from '@nestjs/common';
import {
  OrderDetailResDTO,
  OrderResDTO,
  OrderTableResDTO,
} from '../../dto/response';

@Injectable()
export class OrderProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  override get profile() {
    return (mapper: Mapper) => {
      createMap(
        mapper,
        OrderDetailResDTO,
        OrderResDTO,
        forMember(
          (destination) => destination._id,
          mapFrom((source) => source._id),
        ),
        forMember(
          (destination) => destination.date,
          mapFrom((source) => source.date),
        ),
        forMember(
          (destination) => destination.orderItems,
          mapFrom((source) => source.orderItems),
        ),
        forMember(
          (destination) => destination.paymentMethod,
          mapFrom((source) => source.paymentMethod),
        ),
        forMember(
          (destination) => destination.orderId,
          mapFrom((source) => source.orderId),
        ),
        forMember(
          (destination) => destination.shippingFee,
          mapFrom((source) => source.shippingFee),
        ),
      );
      createMap(
        mapper,
        OrderResDTO,
        OrderTableResDTO,
        forMember(
          (destination) => destination._id,
          mapFrom((source) => source._id),
        ),
        forMember(
          (destination) => destination.date,
          mapFrom((source) => source.date),
        ),
        forMember(
          (destination) => destination.orderId,
          mapFrom((source) => source.orderId),
        ),
        forMember(
          (destination) => destination.paymentMethod,
          mapFrom((source) => source.paymentMethod),
        ),
        forMember(
          (destination) => destination.total,
          mapFrom(
            (source) =>
              source.orderItems.reduce(
                (total, cur) => total + cur.price * cur.quantity,
                0,
              ) + source.shippingFee,
          ),
        ),
      );
    };
  }
}

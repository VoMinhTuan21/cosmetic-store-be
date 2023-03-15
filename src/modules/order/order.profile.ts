import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { createMap, forMember, Mapper, mapFrom } from '@automapper/core';
import { Injectable } from '@nestjs/common';
import { OrderDetailResDTO, OrderResDTO } from '../../dto/response';

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
          (destination) => destination.shippingFee,
          mapFrom((source) => source.shippingFee),
        ),
      );
    };
  }
}

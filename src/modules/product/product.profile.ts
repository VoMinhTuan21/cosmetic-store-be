import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { createMap, forMember, Mapper, mapFrom } from '@automapper/core';
import { Injectable } from '@nestjs/common';
import { Product } from '../../schemas';
import { ProductSimPleDTO } from '../../dto/response';

@Injectable()
export class ProductProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  override get profile() {
    return (mapper: Mapper) => {
      createMap(
        mapper,
        Product,
        ProductSimPleDTO,
        forMember(
          (destination) => destination._id,
          mapFrom((source) => source._id),
        ),
        forMember(
          (destination) => destination.brand,
          mapFrom((source) => source.brand),
        ),
        forMember(
          (destination) => destination.categories,
          mapFrom((source) => source.categories),
        ),
        forMember(
          (destination) => destination.description,
          mapFrom((source) => source.description),
        ),
        forMember(
          (destination) => destination.name,
          mapFrom((source) => source.name),
        ),
      );
    };
  }
}

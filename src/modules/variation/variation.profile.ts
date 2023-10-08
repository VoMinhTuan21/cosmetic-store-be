import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { createMap, forMember, Mapper, mapFrom } from '@automapper/core';
import { Injectable } from '@nestjs/common';
import { Variation, VariationOption } from '../../schemas';
import { VariationOptionResDTO, VariationResDTO } from '../../dto/response';

@Injectable()
export class VariationProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  override get profile() {
    return (mapper: Mapper) => {
      createMap(
        mapper,
        Variation,
        VariationResDTO,
        forMember(
          (destination) => destination._id,
          mapFrom((source) => source._id),
        ),
        forMember(
          (destination) => destination.name,
          mapFrom((source) => source.name),
        ),
      );
    };
  }
}

@Injectable()
export class VariationOptionProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  override get profile() {
    return (mapper: Mapper) => {
      createMap(
        mapper,
        VariationOption,
        VariationOptionResDTO,
        forMember(
          (destination) => destination._id,
          mapFrom((source) => source._id),
        ),
        forMember(
          (destination) => destination.value,
          mapFrom((source) => source.value),
        ),
      );
    };
  }
}

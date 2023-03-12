import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { createMap, forMember, Mapper, mapFrom } from '@automapper/core';
import { Injectable } from '@nestjs/common';
import { Tag } from '../../schemas/tag.schema';
import { TagResDTO } from '../../dto/response';

@Injectable()
export class TagProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  override get profile() {
    return (mapper: Mapper) => {
      createMap(
        mapper,
        Tag,
        TagResDTO,
        forMember(
          (destination) => destination._id,
          mapFrom((source) => source._id),
        ),
        forMember(
          (destination) => destination.name,
          mapFrom((source) => source.name),
        ),
        forMember(
          (destination) => destination.weight,
          mapFrom((source) => source.weight),
        ),
      );
    };
  }
}

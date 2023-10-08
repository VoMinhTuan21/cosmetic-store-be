import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { createMap, forMember, Mapper, mapFrom } from '@automapper/core';
import { Injectable } from '@nestjs/common';
import { Tag } from '../../schemas/tag.schema';
import { TagGroupResDTO, TagResDTO, TagTableResDTO } from '../../dto/response';
import { TagGroup } from '../../schemas/tagGroup.schema';

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
        forMember(
          (destination) => destination.parent,
          mapFrom((source) => source.parent),
        ),
      );
      createMap(
        mapper,
        TagGroup,
        TagGroupResDTO,
        forMember(
          (destination) => destination._id,
          mapFrom((source) => source._id),
        ),
        forMember(
          (destination) => destination.name,
          mapFrom((source) => source.name),
        ),
      );
      createMap(
        mapper,
        Tag,
        TagTableResDTO,
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

import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { createMap, forMember, Mapper, mapFrom } from '@automapper/core';
import { Injectable } from '@nestjs/common';
import { Address, User } from '../../schemas';
import { AddressResDTO, UserBasicInfoDto } from '../../dto/response';

@Injectable()
export class UserProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  override get profile() {
    return (mapper: Mapper) => {
      createMap(
        mapper,
        User,
        UserBasicInfoDto,
        forMember(
          (destination) => destination._id,
          mapFrom((source) => source._id),
        ),
        forMember(
          (destination) => destination.birthday,
          mapFrom((source) => source.birthday),
        ),
        forMember(
          (destination) => destination.email,
          mapFrom((source) => source.email),
        ),
        forMember(
          (destination) => destination.gender,
          mapFrom((source) => source.gender),
        ),
        forMember(
          (destination) => destination.name,
          mapFrom((source) => source.name),
        ),
      );
      createMap(
        mapper,
        Address,
        AddressResDTO,
        forMember(
          (destination) => destination._id,
          mapFrom((source) => source._id),
        ),
        forMember(
          (destination) => destination.coordinates,
          mapFrom((source) => source.coordinates),
        ),
        forMember(
          (destination) => destination.district,
          mapFrom((source) => source.district),
        ),
        forMember(
          (destination) => destination.name,
          mapFrom((source) => source.name),
        ),
        forMember(
          (destination) => destination.phone,
          mapFrom((source) => source.phone),
        ),
        forMember(
          (destination) => destination.province,
          mapFrom((source) => source.province),
        ),
        forMember(
          (destination) => destination.specificAddress,
          mapFrom((source) => source.specificAddress),
        ),
        forMember(
          (destination) => destination.ward,
          mapFrom((source) => source.ward),
        ),
      );
    };
  }
}

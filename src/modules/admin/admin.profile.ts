import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { createMap, forMember, Mapper, mapFrom } from '@automapper/core';
import { Injectable } from '@nestjs/common';
import { AdminResDTO } from '../../dto/response';
import { Admin } from '../../schemas';

@Injectable()
export class AdminProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  override get profile() {
    return (mapper: Mapper) => {
      createMap(
        mapper,
        Admin,
        AdminResDTO,
        forMember(
          (destination) => destination._id,
          mapFrom((source) => source._id),
        ),
        forMember(
          (destination) => destination.name,
          mapFrom((source) => source.name),
        ),
        forMember(
          (destination) => destination.email,
          mapFrom((source) => source.email),
        ),
        forMember(
          (destination) => destination.birthday,
          mapFrom((source) => source.birthday),
        ),
        forMember(
          (destination) => destination.gender,
          mapFrom((source) => source.gender),
        ),
        forMember(
          (destination) => destination.role,
          mapFrom((source) => source.role),
        ),
      );
    };
  }
}

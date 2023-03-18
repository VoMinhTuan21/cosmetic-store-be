import { PickType } from '@nestjs/swagger';
import { AdminRole } from '../../constances/enum';
import { CreateAdminDTO } from '../request';

export class AdminResDTO extends PickType(CreateAdminDTO, [
  'birthday',
  'email',
  'gender',
  'name',
]) {
  _id: string;
  role: AdminRole;
}

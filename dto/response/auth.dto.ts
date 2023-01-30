import { Gender } from '../../src/constances/enum';

export class UserBasicInfoDto {
  _id: string;
  name: string;
  birthday: string;
  email: string;
  gender: Gender;
}

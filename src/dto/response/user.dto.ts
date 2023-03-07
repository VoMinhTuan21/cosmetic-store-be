import { AddressDTO } from '../request/user.dto';

export class AddressResDTO extends AddressDTO {
  _id: string;
  default: boolean;
}

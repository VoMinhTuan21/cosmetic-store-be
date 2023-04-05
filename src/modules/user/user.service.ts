import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  CHANGE_DEFAULT_ADDRESS_SUCCESS,
  CHANGE_PASS_SUCCESS,
  CREATE_ADDRESS_SUCCESS,
  DELETE_ADDRESS_SUCCESS,
  ERROR_ADDRESS_NOT_FOUND,
  ERROR_CHANGE_DEFAULT_ADDRESS,
  CHECK_USER_HAS_PASS_SUCCESS,
  CREATE_PASSWORD_SUCCESS,
  ERROR_CHANGE_PASS,
  ERROR_CREATE_ADDRESS,
  ERROR_DELETE_ADDRESS,
  ERROR_DO_NOT_DELETE_DEFAULT_ADDREESS,
  ERROR_CHECK_USER_HAS_PASS,
  ERROR_CREATE_PASSWORD,
  ERROR_EMAIL_HAS_BEEN_USED,
  ERROR_GET_USER_BY_EMAIL,
  ERROR_PASSWORD_NOT_MATCH,
  ERROR_SIGN_IN,
  ERROR_SIGN_UP,
  ERROR_UPDATE_ADDRESS,
  ERROR_UPDATE_USER,
  ERROR_USER_NOT_EXIST,
  GET_USER_BY_EMAIL_SUCCESS,
  UPDATE_USER_SUCCESS,
  ERROR_GET_ADDRESSES,
  GET_ADDRESSES_SUCCESS,
  UPDATE_ADDRESS_SUCCESS,
} from '../../constances';
import { Gender, Role } from '../../constances/enum';

import {
  DefaultUser,
  SignUpWithPassword,
  SignInDTO,
  UpdateUserDTO,
  ChangePassDTO,
  AddressDTO,
  SignUpTempUserWithPassword,
} from '../../dto/request';
import { AddressResDTO, UserBasicInfoDto } from '../../dto/response';
import { Address, AddressDocument, User, UserDocument } from '../../schemas';
import {
  handleResponseFailure,
  handleResponseSuccess,
} from '../../utils/handle-response';
import { hashPasswords, comparePassword } from '../../utils/hash-password';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Address.name) private addressModel: Model<AddressDocument>,
    @InjectMapper() private readonly mapper: Mapper,
  ) {}

  async findUserByEmail(email: string): Promise<IJWTInfo | null> {
    const user = await this.userModel.findOne({ email: email });
    if (user) {
      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        roles: [Role.User],
      };
    }

    return null;
  }

  async findUserById(id: string): Promise<IJWTInfo | null> {
    const user = await this.userModel.findById(id);
    if (user) {
      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        roles: [Role.User],
      };
    }

    return null;
  }

  async createUserForSocialLogin(data: DefaultUser): Promise<IJWTInfo> {
    const user = await this.userModel.create({
      name: data.name,
      email: data.email,
      image: data.image,
    });

    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      roles: [Role.User],
    };
  }

  async signUP(data: SignUpWithPassword) {
    try {
      const userEmail = await this.userModel.findOne({ email: data.email });
      if (userEmail) {
        handleResponseFailure({
          error: ERROR_EMAIL_HAS_BEEN_USED,
          statusCode: HttpStatus.CONFLICT,
        });
      }

      const hasPass = hashPasswords(data.password);

      const newUser = await this.userModel.create({
        birthday: data.birthday,
        email: data.email,
        password: hasPass,
        name: data.name,
        gender: data.gender,
      });

      return newUser;
    } catch (error) {
      console.log('error: ', error);
      handleResponseFailure({
        error: error.response?.error || ERROR_SIGN_UP,
        statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
      });
    }
  }

  async signIn(data: SignInDTO) {
    try {
      const user = await this.userModel.findOne({ email: data.email });
      if (!user) {
        handleResponseFailure({
          error: ERROR_USER_NOT_EXIST,
          statusCode: HttpStatus.NOT_FOUND,
        });
      }

      const isMatchPass = await comparePassword(data.password, user.password);

      if (isMatchPass) {
        return user;
      } else {
        return handleResponseFailure({
          error: ERROR_PASSWORD_NOT_MATCH,
          statusCode: HttpStatus.NOT_ACCEPTABLE,
        });
      }
    } catch (error) {
      console.log('error: ', error);
      return handleResponseFailure({
        error: error.response?.error || ERROR_SIGN_IN,
        statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
      });
    }
  }

  async getUserByEmail(email: string) {
    try {
      const user = await this.userModel.findOne({ email: email });
      return handleResponseSuccess({
        data: this.mapper.map(user, User, UserBasicInfoDto),
        message: GET_USER_BY_EMAIL_SUCCESS,
      });
    } catch (error) {
      return handleResponseFailure({
        error: ERROR_GET_USER_BY_EMAIL,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }
  }

  async update(dto: UpdateUserDTO, id: string) {
    try {
      await this.userModel.findOneAndUpdate(
        { _id: id },
        {
          name: dto.name,
          gender: dto.gender,
          birthday: dto.birthday,
        },
      );

      const user = await this.userModel.findById(id);

      return handleResponseSuccess({
        data: this.mapper.map(user, User, UserBasicInfoDto),
        message: UPDATE_USER_SUCCESS,
      });
    } catch (error) {
      return handleResponseFailure({
        error: ERROR_UPDATE_USER,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }
  }

  async changePass(dto: ChangePassDTO, id: string) {
    try {
      const user = await this.userModel.findById(id);

      const isMatchPass = await comparePassword(dto.oldPass, user.password);

      if (!isMatchPass) {
        return handleResponseFailure({
          error: ERROR_PASSWORD_NOT_MATCH,
          statusCode: HttpStatus.BAD_REQUEST,
        });
      }

      user.password = hashPasswords(dto.newPass);
      user.save();

      return handleResponseSuccess({
        data: CHANGE_PASS_SUCCESS,
        message: CHANGE_PASS_SUCCESS,
      });
    } catch (error) {
      return handleResponseFailure({
        error: error.response?.error || ERROR_CHANGE_PASS,
        statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
      });
    }
  }

  async checkUserHasPass(id: string) {
    try {
      const user = await this.userModel.findById(id);

      return handleResponseSuccess({
        data: user.password ? true : false,
        message: CHECK_USER_HAS_PASS_SUCCESS,
      });
    } catch (error) {
      return handleResponseFailure({
        error: ERROR_CHECK_USER_HAS_PASS,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }
  }

  async createPass(id: string, password: string) {
    try {
      const user = await this.userModel.findById(id);

      const hash = hashPasswords(password);

      user.password = hash;
      await user.save();

      return handleResponseSuccess({
        data: CREATE_PASSWORD_SUCCESS,
        message: CREATE_PASSWORD_SUCCESS,
      });
    } catch (error) {
      return handleResponseFailure({
        error: ERROR_CREATE_PASSWORD,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }
  }

  async createAddress(userId: string, dto: AddressDTO) {
    try {
      const newAddress = await this.addressModel.create({
        name: dto.name,
        phone: dto.phone,
        province: dto.province,
        district: dto.district,
        ward: dto.ward,
        specificAddress: dto.specificAddress,
        coordinates: dto.coordinates,
      });

      await this.userModel.findByIdAndUpdate(userId, {
        $push: {
          addresses: newAddress._id,
        },
      });

      return handleResponseSuccess({
        message: CREATE_ADDRESS_SUCCESS,
        data: this.mapper.map(newAddress, Address, AddressResDTO),
      });
    } catch (error) {
      return handleResponseFailure({
        error: ERROR_CREATE_ADDRESS,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }
  }

  async updateAddress(addressId: string, dto: AddressDTO) {
    try {
      const updatedAddress = await this.addressModel.findByIdAndUpdate(
        addressId,
        { ...dto },
        {
          new: true,
        },
      );

      return handleResponseSuccess({
        message: UPDATE_ADDRESS_SUCCESS,
        data: this.mapper.map(updatedAddress, Address, AddressResDTO),
      });
    } catch (error) {
      return handleResponseFailure({
        error: ERROR_UPDATE_ADDRESS,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }
  }

  async changeDefaultAddress(userId: string, addressId: string) {
    try {
      // change another address become default = fasle if it is true before
      const user = await this.userModel.findById(userId, 'addresses');
      let addressIds: string[] = user.addresses as string[];
      addressIds = addressIds.filter((item) => item !== addressId);

      for (const id of addressIds) {
        const address = await this.addressModel.findById(id);
        if (address.default === true) {
          address.default = false;
          await address.save();
        }
      }

      // change the specific address default to true
      await this.addressModel.findByIdAndUpdate(addressId, {
        default: true,
      });

      return handleResponseSuccess({
        message: CHANGE_DEFAULT_ADDRESS_SUCCESS,
        data: addressId,
      });
    } catch (error) {
      return handleResponseFailure({
        error: ERROR_CHANGE_DEFAULT_ADDRESS,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }
  }

  async deleteAdderss(userId: string, addressId: string) {
    try {
      const address = await this.addressModel.findById(addressId);
      if (address.default === true) {
        return handleResponseFailure({
          error: ERROR_DO_NOT_DELETE_DEFAULT_ADDREESS,
          statusCode: HttpStatus.BAD_REQUEST,
        });
      }
      await address.delete();

      await this.userModel.findByIdAndUpdate(userId, {
        $pull: {
          addresses: addressId,
        },
      });

      return handleResponseSuccess({
        message: DELETE_ADDRESS_SUCCESS,
        data: addressId,
      });
    } catch (error) {
      return handleResponseFailure({
        error: error.response?.error || ERROR_DELETE_ADDRESS,
        statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
      });
    }
  }

  async getAddresses(userId: string) {
    try {
      const user = await this.userModel
        .findById(userId, 'addresses')
        .populate(
          'addresses',
          'name phone province district ward specificAddress coordinates default',
        );

      if (!user) {
        return handleResponseFailure({
          error: ERROR_USER_NOT_EXIST,
          statusCode: HttpStatus.NOT_FOUND,
        });
      }

      return handleResponseSuccess({
        message: GET_ADDRESSES_SUCCESS,
        data: user.addresses,
      });
    } catch (error) {
      return handleResponseFailure({
        error: error.response?.error || ERROR_GET_ADDRESSES,
        statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
      });
    }
  }

  async getUsersTemp() {
    const users = await this.userModel.find({
      email: { $regex: 'hygge', $options: 'i' },
    });

    return users.map((user) => user._id.toString());
  }

  async createTempUser(name: string, email: string) {
    try {
      const userEmail = await this.userModel.findOne({ email: email });
      if (userEmail) {
        handleResponseFailure({
          error: ERROR_EMAIL_HAS_BEEN_USED,
          statusCode: HttpStatus.CONFLICT,
        });
      }

      const hasPass = hashPasswords('@Voxuantu8121');

      const newUser = await this.userModel.create({
        birthday: '2001-01-01',
        email: email,
        password: hasPass,
        name: name,
        gender: Gender.Female,
        addresses: ['642aee62d8434479d5e1dc0b'],
      });

      return newUser;
    } catch (error) {
      console.log('error: ', error);
      handleResponseFailure({
        error: error.response?.error || ERROR_SIGN_UP,
        statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
      });
    }
  }
}

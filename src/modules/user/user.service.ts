import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  CHANGE_PASS_SUCCESS,
  ERROR_CHANGE_PASS,
  ERROR_EMAIL_HAS_BEEN_USED,
  ERROR_GET_USER_BY_EMAIL,
  ERROR_PASSWORD_NOT_MATCH,
  ERROR_SIGN_IN,
  ERROR_SIGN_UP,
  ERROR_UPDATE_USER,
  ERROR_USER_NOT_EXIST,
  GET_USER_BY_EMAIL_SUCCESS,
  UPDATE_USER_SUCCESS,
} from '../../constances';

import { DefaultUser, SignUpWithPassword, SignInDTO } from '../../dto/request';
import { ChangePassDTO, UpdateUserDTO } from '../../dto/request/user.dto';
import { UserBasicInfoDto } from '../../dto/response';
import { User, UserDocument } from '../../schemas';
import {
  handleResponseFailure,
  handleResponseSuccess,
} from '../../utils/handle-response';
import { hashPasswords, comparePassword } from '../../utils/hash-password';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectMapper() private readonly mapper: Mapper,
  ) {}

  async findUserByEmail(email: string): Promise<IJWTInfo | null> {
    const user = await this.userModel.findOne({ email: email });
    if (user) {
      return {
        _id: user._id,
        name: user.name,
        email: user.email,
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
}

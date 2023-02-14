import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ERROR_EMAIL_HAS_BEEN_USED,
  ERROR_PASSWORD_NOT_MATCH,
  ERROR_SIGN_IN,
  ERROR_SIGN_UP,
  ERROR_USER_NOT_EXIST,
} from '../../constances';
import { DefaultUser, SignUpWithPassword, SignInDTO } from '../../dto/request';
import { User, UserDocument } from '../../schemas';
import { handleResponseFailure } from '../../utils/handle-response';
import { hashPasswords, comparePassword } from '../../utils/hash-password';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

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

      if (comparePassword(data.password, user.password)) {
        return user;
      } else {
        handleResponseFailure({
          error: ERROR_PASSWORD_NOT_MATCH,
          statusCode: HttpStatus.NOT_ACCEPTABLE,
        });
      }
    } catch (error) {
      console.log('error: ', error);
      handleResponseFailure({
        error: error.response?.error || ERROR_SIGN_IN,
        statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
      });
    }
  }
}

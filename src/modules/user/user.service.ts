import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DefaultUser, SignUpWithPassword } from '../../../dto/request/auth.dto';
import { handleResponseFailure } from '../../../utils/handle-response';
import { hashPasswords } from '../../../utils/hash-password';
import { ERROR_EMAIL_HAS_BEEN_USED, ERROR_SIGN_UP } from '../../constances';
import { User, UserDocument } from '../../schemas';

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
}

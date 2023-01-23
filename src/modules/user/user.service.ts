import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DefaultUser } from '../../../dto/request/auth.dto';
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
}

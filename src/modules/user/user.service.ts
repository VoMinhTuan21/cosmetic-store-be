import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DefaultUser } from '../../../dto/request/auth.dto';
import { User, UserDocument } from '../../schemas';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findUserIdByEmail(email: string): Promise<string | null> {
    const user = await this.userModel.findOne({ email: email });
    if (user) {
      return user.id;
    }

    return null;
  }

  async createUserForSocialLogin(data: DefaultUser): Promise<string> {
    const user = await this.userModel.create({
      name: data.name,
      email: data.email,
      image: data.image,
    });

    return user.id;
  }
}

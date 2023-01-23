import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SignInWithSocialMediaDTO } from '../../../dto/request/auth.dto';
import {
  handleResponseFailure,
  handleResponseSuccess,
} from '../../../utils/handle-response';
import {
  ACCOUNT_ALREADY_LINK_TO_THIS_SOCIAL_MEDIA,
  SIGN_SUCCESS,
} from '../../constances';
import { Account, AccountDocument } from '../../schemas';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Account.name) private accountModel: Model<AccountDocument>,
    private readonly userService: UserService,
  ) {}

  async loginWithSocialMedia(data: SignInWithSocialMediaDTO) {
    const userId = await this.userService.findUserIdByEmail(data.user.email);

    if (userId) {
      const status = await this.findStatusOfAccount(
        userId,
        data.account.provider,
        data.account.providerAccountId,
      );

      switch (status) {
        case 'existed':
          return handleResponseSuccess<boolean>({
            data: true,
            message: SIGN_SUCCESS,
          });

        case 'dif proverderAccountId':
          return handleResponseFailure({
            error: ACCOUNT_ALREADY_LINK_TO_THIS_SOCIAL_MEDIA,
            statusCode: HttpStatus.NOT_ACCEPTABLE,
          });

        case 'not existed':
          await this.accountModel.create({
            access_token: data.account.access_token,
            token_type: data.account.token_type,
            id_token: data.account.id_token,
            refresh_token: data.account.refresh_token,
            scope: data.account.scope,
            expires_at: data.account.expires_at,
            session_state: data.account.session_state,
            providerAccountId: data.account.providerAccountId,
            provider: data.account.provider,
            type: data.account.type,
            userId: userId,
          });
          return handleResponseSuccess<boolean>({
            data: true,
            message: SIGN_SUCCESS,
          });

        default:
          break;
      }
    } else {
      const newUserId = await this.userService.createUserForSocialLogin(
        data.user,
      );

      await this.accountModel.create({
        ...data.account,
        userId: newUserId,
      });

      return handleResponseSuccess<boolean>({
        data: true,
        message: SIGN_SUCCESS,
      });
    }
  }

  async findStatusOfAccount(
    userId: string,
    provider: string,
    providerAccountId: string,
  ): Promise<'existed' | 'dif proverderAccountId' | 'not existed'> {
    const account = await this.accountModel.findOne({
      provider: provider,
      userId: userId,
    });

    if (account) {
      if (account.providerAccountId === providerAccountId) {
        return 'existed';
      } else {
        return 'dif proverderAccountId';
      }
    }

    return 'not existed';
  }
}

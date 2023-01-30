import { Injectable, HttpStatus, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  SignInDTO,
  SignInWithSocialMediaDTO,
} from '../../../dto/request/auth.dto';
import {
  handleResponseFailure,
  handleResponseSuccess,
} from '../../../utils/handle-response';
import {
  ACCOUNT_ALREADY_LINK_TO_THIS_SOCIAL_MEDIA,
  SIGN_SUCCESS,
  USER_NOT_EXIST,
} from '../../constances';
import { Account, AccountDocument } from '../../schemas';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Account.name) private accountModel: Model<AccountDocument>,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    @Inject(ConfigService) private config: ConfigService,
  ) {}

  async loginWithSocialMedia(data: SignInWithSocialMediaDTO) {
    const user = await this.userService.findUserByEmail(data.user.email);

    if (user) {
      const status = await this.findStatusOfAccount(
        user._id,
        data.account.provider,
        data.account.providerAccountId,
      );

      switch (status) {
        case 'existed':
          return handleResponseSuccess<{ token: string; user: IJWTInfo }>({
            data: {
              token: await this.signJWTToken(user._id, user.email, user.name),
              user: user,
            },
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
            userId: user._id,
          });
          return handleResponseSuccess<{ token: string; user: IJWTInfo }>({
            data: {
              token: await this.signJWTToken(user._id, user.email, user.name),
              user: user,
            },
            message: SIGN_SUCCESS,
          });

        default:
          break;
      }
    } else {
      const newUser = await this.userService.createUserForSocialLogin(
        data.user,
      );

      await this.accountModel.create({
        ...data.account,
        userId: newUser._id,
      });

      return handleResponseSuccess<{ token: string; user: IJWTInfo }>({
        data: {
          token: await this.signJWTToken(
            newUser._id,
            newUser.email,
            newUser.name,
          ),
          user: newUser,
        },
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

  private async signJWTToken(
    _id: string,
    email: string,
    name: string,
  ): Promise<string> {
    const secret: string = this.config.get('JWT_SECRET');
    const payload: IJWTInfo = {
      _id,
      email,
      name,
    };
    return this.jwtService.signAsync(payload, {
      expiresIn: this.config.get<string>('JWT_EXPIRATION_TIME'),
      secret,
    });
  }

  async signIn(data: SignInDTO) {
    const user = await this.userService.findUserByEmail(data.email);

    if (!user) {
      return handleResponseFailure({
        error: USER_NOT_EXIST,
        statusCode: HttpStatus.NOT_FOUND,
      });
    }
  }
}

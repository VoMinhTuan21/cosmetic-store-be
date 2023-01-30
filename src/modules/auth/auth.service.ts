import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { Injectable, HttpStatus, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  SignInDTO,
  SignInWithSocialMediaDTO,
  SignUpWithPassword,
} from '../../../dto/request/auth.dto';
import { UserBasicInfoDto } from '../../../dto/response/auth.dto';
import {
  handleResponseFailure,
  handleResponseSuccess,
} from '../../../utils/handle-response';
import { comparePassword } from '../../../utils/hash-password';
import {
  ERROR_ACCOUNT_ALREADY_LINK_TO_THIS_SOCIAL_MEDIA,
  ERROR_SIGN_UP,
  SIGN_SUCCESS,
  SIGN_UP_SUCCESS,
  ERROR_USER_NOT_EXIST,
  SIGN_IN_SUCCESS,
  ERROR_SIGN_IN,
} from '../../constances';
import { Account, AccountDocument, User } from '../../schemas';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Account.name) private accountModel: Model<AccountDocument>,
    @InjectMapper() private readonly mapper: Mapper,
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
            error: ERROR_ACCOUNT_ALREADY_LINK_TO_THIS_SOCIAL_MEDIA,
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
    rememberMe = false,
  ): Promise<string> {
    const secret: string = this.config.get('JWT_SECRET');
    const payload: IJWTInfo = {
      _id,
      email,
      name,
    };

    let expiresIn = this.config.get('JWT_EXPIRATION_TIME_SHORT');

    if (rememberMe) {
      expiresIn = this.config.get('JWT_EXPIRATION_TIME_LONG');
    }

    return this.jwtService.signAsync(payload, {
      expiresIn: expiresIn,
      secret,
    });
  }

  async signup(data: SignUpWithPassword) {
    try {
      const newUser = await this.userService.signUP(data);
      return handleResponseSuccess({
        data: {
          token: await this.signJWTToken(
            newUser._id,
            newUser.email,
            newUser.email,
          ),
          user: this.mapper.map(newUser, User, UserBasicInfoDto),
        },
        message: SIGN_UP_SUCCESS,
      });
    } catch (error) {
      console.log('error: ', error);
      return handleResponseFailure({
        error: error.response?.error || ERROR_SIGN_UP,
        statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
      });
    }
  }

  async signIn(data: SignInDTO) {
    try {
      const user = await this.userService.signIn(data);
      return handleResponseSuccess({
        data: {
          token: await this.signJWTToken(
            user._id,
            user.email,
            user.email,
            data.rememberMe,
          ),
          user: this.mapper.map(user, User, UserBasicInfoDto),
        },
        message: SIGN_IN_SUCCESS,
      });
    } catch (error) {
      console.log('error: ', error);
      return handleResponseFailure({
        error: error.response?.error || ERROR_SIGN_IN,
        statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
      });
    }
  }
}

import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { Injectable, HttpStatus, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ERROR_ACCOUNT_ALREADY_LINK_TO_THIS_SOCIAL_MEDIA,
  ERROR_SIGN_UP,
  SIGN_SUCCESS,
  SIGN_UP_SUCCESS,
  SIGN_IN_SUCCESS,
  ERROR_SIGN_IN,
  ERROR_SEND_OTP,
  ERROR_EMAIL_HAS_BEEN_USED,
  SEND_OTP_SUCCESS,
  ERROR_SIGN_IN_WITH_SOCIAL_MEDIA,
  CHECK_STATUS_WITH_SOCIAL_ACCOUNT_SUCCESS,
  ERROR_CHECK_STATUS_WITH_SOCIAL_ACCOUNT,
  ERROR_ALREADY_LINKED_TO_ANOTHER_ACCOUNT,
  LINK_ACCOUNT_SUCCESS,
  ERROR_LINK_ACCOUNT,
  ERROR_USER_NOT_EXIST,
} from '../../constances';
import { Role } from '../../constances/enum';
import {
  SignInWithSocialMediaDTO,
  SignUpWithPassword,
  SignInDTO,
} from '../../dto/request';
import { UserBasicInfoDto } from '../../dto/response';
import { Account, AccountDocument, User } from '../../schemas';
import {
  handleResponseSuccess,
  handleResponseFailure,
} from '../../utils/handle-response';
import { MailService } from '../mail/mail.service';
import { OtpverificationService } from '../otpverification/otpverification.service';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Account.name) private accountModel: Model<AccountDocument>,
    @InjectMapper() private readonly mapper: Mapper,
    @Inject(ConfigService) private config: ConfigService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly otpService: OtpverificationService,
  ) {}

  async signJWTToken(
    _id: string,
    email: string,
    name: string,
    rememberMe = false,
    roles: Role[] = [Role.User],
  ): Promise<string> {
    const secret: string = this.config.get('JWT_SECRET');
    const payload: IJWTInfo = {
      _id,
      email,
      name,
      roles,
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
      // verify otp
      await this.otpService.verifyOTP(data.email, data.code);
      // create new user
      const newUser = await this.userService.signUP(data);
      return handleResponseSuccess({
        // data: {
        //   token: await this.signJWTToken(
        //     newUser._id,
        //     newUser.email,
        //     newUser.email,
        //   ),
        //   user: this.mapper.map(newUser, User, UserBasicInfoDto),
        // },
        data: null,
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
      if (user) {
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
      }
    } catch (error) {
      console.log('error: ', error);
      return handleResponseFailure({
        error: error.response?.error || ERROR_SIGN_IN,
        statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
      });
    }
  }

  async sendMailOTP(email: string) {
    try {
      const userEmail = await this.userService.findUserByEmail(email);
      if (userEmail) {
        handleResponseFailure({
          error: ERROR_EMAIL_HAS_BEEN_USED,
          statusCode: HttpStatus.CONFLICT,
        });
      }

      const otp = Math.floor(100000 + Math.random() * 900000);

      await this.otpService.create(email, otp.toString());
      await this.mailService.sendUserConfirmation(email, otp.toString());

      return handleResponseSuccess({
        data: null,
        message: SEND_OTP_SUCCESS,
      });
    } catch (error) {
      console.log('error: ', error);
      return handleResponseFailure({
        error: error.response?.error || ERROR_SEND_OTP,
        statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
      });
    }
  }

  async sendOTP(email: string) {
    try {
      const otp = Math.floor(100000 + Math.random() * 900000);

      await this.otpService.create(email, otp.toString());
      await this.mailService.sendUserConfirmation(email, otp.toString());

      return handleResponseSuccess({
        data: null,
        message: SEND_OTP_SUCCESS,
      });
    } catch (error) {
      return handleResponseFailure({
        error: error.response?.error || ERROR_SEND_OTP,
        statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
      });
    }
  }

  async loginWithSocialMedia(data: SignInWithSocialMediaDTO) {
    try {
      const account = await this.accountModel.findOne({
        provider: data.account.provider,
        userEmail: data.user.email,
      });

      // if has user and account then login
      if (account) {
        const user = await this.userService.findUserById(
          account.userId as string,
        );
        return handleResponseSuccess<{ token: string; user: IJWTInfo }>({
          data: {
            token: await this.signJWTToken(
              user._id,
              user.email,
              user.name,
              false,
            ),
            user: user,
          },
          message: SIGN_SUCCESS,
        });
      }

      const user = await this.userService.findUserByEmail(data.user.email);
      // if has user but not have social account
      if (user) {
        await this.accountModel.create({
          ...data.account,
          userId: user._id,
          userEmail: user.email,
        });

        return handleResponseSuccess<{ token: string; user: IJWTInfo }>({
          data: {
            token: await this.signJWTToken(
              user._id,
              user.email,
              user.name,
              false,
            ),
            user: user,
          },
          message: SIGN_SUCCESS,
        });
      }

      // if no user and no social account
      const newUser = await this.userService.createUserForSocialLogin(
        data.user,
      );

      await this.accountModel.create({
        ...data.account,
        userId: newUser._id,
        userEmail: newUser.email,
      });

      return handleResponseSuccess<{ token: string; user: IJWTInfo }>({
        data: {
          token: await this.signJWTToken(
            newUser._id,
            newUser.email,
            newUser.name,
            false,
          ),
          user: newUser,
        },
        message: SIGN_SUCCESS,
      });
    } catch (error) {
      return handleResponseFailure({
        error: ERROR_SIGN_IN_WITH_SOCIAL_MEDIA,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }
  }

  async checkStatusWithSocialAccount(id: string) {
    try {
      const facebook = await this.accountModel.findOne({
        userId: id,
        provider: 'facebook',
      });
      const google = await this.accountModel.findOne({
        userId: id,
        provider: 'google',
      });

      return handleResponseSuccess({
        data: {
          facebook: facebook ? true : false,
          google: google ? true : false,
        },
        message: CHECK_STATUS_WITH_SOCIAL_ACCOUNT_SUCCESS,
      });
    } catch (error) {
      return handleResponseFailure({
        error: ERROR_CHECK_STATUS_WITH_SOCIAL_ACCOUNT,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }
  }

  async linkSocialAccount(email: string, data: SignInWithSocialMediaDTO) {
    try {
      const user = await this.userService.findUserByEmail(email);

      if (!user) {
        return handleResponseFailure({
          error: ERROR_USER_NOT_EXIST,
          statusCode: HttpStatus.BAD_REQUEST,
        });
      }

      const account = await this.accountModel.findOne({
        provider: data.account.provider,
        userEmail: data.user.email,
      });

      if (account) {
        return handleResponseFailure({
          error: ERROR_ALREADY_LINKED_TO_ANOTHER_ACCOUNT,
          statusCode: HttpStatus.CONFLICT,
        });
      }

      await this.accountModel.create({
        ...data.account,
        userId: user._id,
        userEmail: data.user.email,
      });

      return handleResponseSuccess({
        data: {
          token: await this.signJWTToken(
            user._id,
            user.email,
            user.name,
            false,
          ),
          user: user,
        },
        message: LINK_ACCOUNT_SUCCESS,
      });
    } catch (error) {
      return handleResponseFailure({
        error: error.response?.error || ERROR_LINK_ACCOUNT,
        statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
      });
    }
  }
}

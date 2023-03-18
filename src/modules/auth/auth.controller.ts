import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import {
  SignInDTO,
  SignInWithSocialMediaDTO,
  SignUpWithPassword,
  sendMailOTP,
} from '../../dto/request';
import { JwtGuard } from '../../guards/jwt.guard';
import { handleResponseSuccess } from '../../utils/handle-response';
import { AuthService } from './auth.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/sign-in')
  signIn(@Body() data: SignInDTO) {
    return this.authService.signIn(data);
  }

  @Post('/sign-in/social-media')
  signInWithSocialMedia(@Body() data: SignInWithSocialMediaDTO) {
    return this.authService.loginWithSocialMedia(data);
  }

  @Post('/sign-up')
  signUp(@Body() data: SignUpWithPassword) {
    return this.authService.signup(data);
  }

  @Post('/send-mail-otp')
  sendMailOTP(@Body() data: sendMailOTP) {
    return this.authService.sendMailOTP(data.email);
  }

  @Post('/send-otp')
  sendOTP(@Body() data: sendMailOTP) {
    return this.authService.sendOTP(data.email);
  }

  @ApiBearerAuth('access_token')
  @UseGuards(JwtGuard)
  @Get('/check-status-social-account')
  checkStatusWithSocialAccount(@Req() req: Request) {
    return this.authService.checkStatusWithSocialAccount(
      (req.user as IJWTInfo)._id,
    );
  }

  @ApiBearerAuth('access_token')
  @UseGuards(JwtGuard)
  @Post('/link-social-account')
  linkSocialAccount(
    @Req() req: Request,
    @Body() data: SignInWithSocialMediaDTO,
  ) {
    return this.authService.linkSocialAccount(
      (req.user as IJWTInfo).email,
      data,
    );
  }
}

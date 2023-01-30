import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  sendMailOTP,
  SignInDTO,
  SignInWithSocialMediaDTO,
  SignUpWithPassword,
} from '../../../dto/request/auth.dto';
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
}

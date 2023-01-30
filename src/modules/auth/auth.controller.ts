import { Body, Controller, Post } from '@nestjs/common';
import {
  SignInDTO,
  SignInWithSocialMediaDTO,
} from '../../../dto/request/auth.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/sign-in')
  signIn(@Body() data: SignInDTO) {
    return 'he';
  }

  @Post('/sign-in/social-media')
  signInWithSocialMedia(@Body() data: SignInWithSocialMediaDTO) {
    return this.authService.loginWithSocialMedia(data);
  }
}

import { Body, Controller, Post } from '@nestjs/common';
import { SignInWithSocialMediaDTO } from '../../../dto/request/auth.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/sign-in/social-media')
  signInWithSocialMedia(@Body() data: SignInWithSocialMediaDTO) {
    return this.authService.loginWithSocialMedia(data);
  }
}

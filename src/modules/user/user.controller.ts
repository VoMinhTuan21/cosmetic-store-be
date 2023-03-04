import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ChangePassDTO, UpdateUserDTO } from '../../dto/request/user.dto';
import { JwtGuard } from '../../guards/jwt.guard';
import { UserService } from './user.service';
import { Request } from 'express';

@ApiTags('User')
@Controller('user')
@ApiBearerAuth('access_token')
@UseGuards(JwtGuard)
export class UserController {
  constructor(private readonly useService: UserService) {}

  @Get('/:email')
  getUserByEmail(@Param('email') email: string) {
    return this.useService.getUserByEmail(email);
  }

  @Put()
  updateUser(@Body() dto: UpdateUserDTO, @Req() req: Request) {
    return this.useService.update(dto, (req.user as IJWTInfo)._id);
  }

  @Put('/change-pass')
  changePass(@Body() dto: ChangePassDTO, @Req() req: Request) {
    return this.useService.changePass(dto, (req.user as IJWTInfo)._id);
  }
}

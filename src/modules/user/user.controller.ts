import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  ChangePassDTO,
  CreatePassDTO,
  UpdateUserDTO,
} from '../../dto/request/user.dto';
import { JwtGuard } from '../../guards/jwt.guard';
import { UserService } from './user.service';
import { Request } from 'express';

@ApiTags('User')
@Controller('user')
@ApiBearerAuth('access_token')
@UseGuards(JwtGuard)
export class UserController {
  constructor(private readonly useService: UserService) {}

  @Get('/check-pass')
  checkPass(@Req() req: Request) {
    return this.useService.checkUserHasPass((req.user as IJWTInfo)._id);
  }

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

  @Post('/create-pass')
  createPass(@Body() dto: CreatePassDTO, @Req() req: Request) {
    return this.useService.createPass((req.user as IJWTInfo)._id, dto.password);
  }
}

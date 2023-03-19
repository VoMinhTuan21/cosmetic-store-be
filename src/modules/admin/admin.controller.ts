import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Role } from '../../constances/enum';
import { Roles } from '../../decorator/role.decorator';
import { CreateAdminDTO, SignInAdminDTO } from '../../dto/request';
import { JwtGuard } from '../../guards/jwt.guard';
import { RolesGuard } from '../../guards/role.guard';
import { AdminService } from './admin.service';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post()
  createAdmin(@Body() dto: CreateAdminDTO) {
    return this.adminService.createAdmin(dto);
  }

  @Post('/sign-in')
  signIn(@Body() dto: SignInAdminDTO) {
    return this.adminService.signIn(dto);
  }

  @Get()
  @ApiBearerAuth('access_token')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  @UseGuards(JwtGuard)
  getAdminInfo(@Req() req: Request) {
    return this.adminService.getuserInfo((req.user as IJWTInfo)._id);
  }
}

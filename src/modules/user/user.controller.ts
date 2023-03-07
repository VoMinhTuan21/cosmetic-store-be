import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from '../../guards/jwt.guard';
import { UserService } from './user.service';
import { Request } from 'express';
import { ValidateMongoId } from '../../utils/validate-pipe';
import {
  UpdateUserDTO,
  ChangePassDTO,
  AddressDTO,
  CreatePassDTO,
} from '../../dto/request';

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

  @Post('/address')
  createAddress(@Body() dto: AddressDTO, @Req() req: Request) {
    return this.useService.createAddress((req.user as IJWTInfo)._id, dto);
  }

  @Put('/address/:addressId')
  updateAddress(
    @Body() dto: AddressDTO,
    @Param('addressId', ValidateMongoId) addressId: string,
  ) {
    return this.useService.updateAddress(addressId, dto);
  }

  @Put('/address/default/:addressId')
  changeDefaultAddress(
    @Param('addressId', ValidateMongoId) addressId: string,
    @Req() req: Request,
  ) {
    return this.useService.changeDefaultAddress(
      (req.user as IJWTInfo)._id,
      addressId,
    );
  }

  @Delete('/address/:addressId')
  deleteAddress(
    @Param('addressId', ValidateMongoId) addressId: string,
    @Req() req: Request,
  ) {
    return this.useService.deleteAdderss((req.user as IJWTInfo)._id, addressId);
  }

  @Get('/address')
  getAddresses(@Req() req: Request) {
    return this.useService.getAddresses((req.user as IJWTInfo)._id);
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

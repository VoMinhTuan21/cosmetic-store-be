import {
  Body,
  Controller,
  Req,
  UseGuards,
  Get,
  Post,
  Param,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateOrderDTO } from '../../dto/request';
import { JwtGuard } from '../../guards/jwt.guard';
import { Request } from 'express';
import { MomoPaymentDTO, SignatureDTO } from '../../dto/request';
import { OrderService } from './order.service';
import { ValidateMongoId } from '../../utils/validate-pipe';

@ApiTags('Order')
@ApiTags('Order')
@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post('/payment/momo')
  makePaymentMomo(@Body() body: MomoPaymentDTO) {
    return this.orderService.confirmPayWithmomo(body);
  }

  @Get('/:orderId')
  checkOrder(@Param('orderId', ValidateMongoId) orderId: string) {
    return this.orderService.checkOrder(orderId);
  }

  @ApiBearerAuth('access_token')
  @UseGuards(JwtGuard)
  @Post()
  createOrder(@Body() dto: CreateOrderDTO, @Req() req: Request) {
    return this.orderService.createOrder(dto, (req.user as IJWTInfo)._id);
  }
}

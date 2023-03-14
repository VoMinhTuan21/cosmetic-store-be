import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateOrderDTO } from '../../dto/request';
import { JwtGuard } from '../../guards/jwt.guard';
import { OrderService } from './order.service';
import { Request } from 'express';

@ApiTags('Order')
@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @ApiBearerAuth('access_token')
  @UseGuards(JwtGuard)
  @Post()
  createOrder(@Body() dto: CreateOrderDTO, @Req() req: Request) {
    return this.orderService.createOrder(dto, (req.user as IJWTInfo)._id);
  }
}

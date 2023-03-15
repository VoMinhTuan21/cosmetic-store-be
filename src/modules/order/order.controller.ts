import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateOrderDTO } from '../../dto/request';
import { JwtGuard } from '../../guards/jwt.guard';
import { OrderService } from './order.service';
import { Request } from 'express';
import { OrderStatus } from '../../constances/enum';

@ApiTags('Order')
@ApiBearerAuth('access_token')
@UseGuards(JwtGuard)
@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  createOrder(@Body() dto: CreateOrderDTO, @Req() req: Request) {
    return this.orderService.createOrder(dto, (req.user as IJWTInfo)._id);
  }

  @Get('/detail/:id')
  getOrderById(@Param('id') id: OrderStatus, @Req() req: Request) {
    return this.orderService.getOrderById(id, (req.user as IJWTInfo)._id);
  }

  @Get('/:status')
  getOrders(@Param('status') status: OrderStatus, @Req() req: Request) {
    return this.orderService.getOrders(status, (req.user as IJWTInfo)._id);
  }
}

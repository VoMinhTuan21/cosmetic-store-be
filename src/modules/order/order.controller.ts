import {
  Body,
  Controller,
  Req,
  UseGuards,
  Get,
  Post,
  Param,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateOrderDTO, UpdateOrderStatusDTO } from '../../dto/request';
import { JwtGuard } from '../../guards/jwt.guard';
import { Request } from 'express';
import { MomoPaymentDTO, SignatureDTO } from '../../dto/request';
import { OrderService } from './order.service';
import { ValidateMongoId } from '../../utils/validate-pipe';
import { OrderStatus } from '../../constances/enum';

@ApiTags('Order')
@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post('/payment/momo')
  makePaymentMomo(@Body() body: MomoPaymentDTO) {
    return this.orderService.confirmPayWithmomo(body);
  }

  @ApiBearerAuth('access_token')
  @UseGuards(JwtGuard)
  @Post()
  createOrder(@Body() dto: CreateOrderDTO, @Req() req: Request) {
    return this.orderService.createOrder(dto, (req.user as IJWTInfo)._id);
  }

  @ApiBearerAuth('access_token')
  @UseGuards(JwtGuard)
  @Get('/detail/:id')
  getOrderById(@Param('id') id: OrderStatus, @Req() req: Request) {
    return this.orderService.getOrderById(id, (req.user as IJWTInfo)._id);
  }

  @ApiBearerAuth('access_token')
  @UseGuards(JwtGuard)
  @Get('/status/:status')
  getOrders(@Param('status') status: OrderStatus, @Req() req: Request) {
    return this.orderService.getOrders(status, (req.user as IJWTInfo)._id);
  }

  @Get('/:orderId')
  checkOrder(@Param('orderId', ValidateMongoId) orderId: string) {
    return this.orderService.checkOrder(orderId);
  }

  @Put('/status/:orderId')
  updateOrderStatus(
    @Param('orderId', ValidateMongoId) orderId: string,
    @Body() dto: UpdateOrderStatusDTO,
  ) {
    return this.orderService.updateOrderStatus(orderId, dto.status);
  }
}

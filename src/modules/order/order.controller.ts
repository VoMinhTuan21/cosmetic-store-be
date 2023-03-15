import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MomoPaymentDTO, SignatureDTO } from '../../dto/request';
import { OrderService } from './order.service';

@ApiTags('Order')
@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post('/signature')
  createSignatureForMomo(@Body() body: SignatureDTO) {
    return this.orderService.createSignature(body.secretKey, body.rawSignature);
  }

  @Post('/payment/momo')
  makePaymentMomo(@Body() body: MomoPaymentDTO) {
    return this.orderService.confirmPayWithmomo(body);
  }

  @Get('/payment/momo')
  requestPaymentMomo() {
    return this.orderService.paymentWithMomo();
  }
}

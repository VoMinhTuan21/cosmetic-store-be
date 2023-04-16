import {
  Body,
  Controller,
  Req,
  UseGuards,
  Get,
  Post,
  Param,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CreateOrderDTO,
  UpdateOrderStatusDTO,
  QueryGetOrdersDashboard,
  OrderTimeReportDTO,
  OrderOverviewDTO,
} from '../../dto/request';
import { JwtGuard } from '../../guards/jwt.guard';
import { Request } from 'express';
import { MomoPaymentDTO, SignatureDTO } from '../../dto/request';
import { OrderService } from './order.service';
import { ValidateMongoId } from '../../utils/validate-pipe';
import { OrderStatus, Role } from '../../constances/enum';

@ApiTags('Order')
@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post('/payment/momo')
  makePaymentMomo(@Body() body: MomoPaymentDTO) {
    return this.orderService.confirmPayWithMomo(body);
  }

  @ApiBearerAuth('access_token')
  @UseGuards(JwtGuard)
  @Post()
  createOrder(@Body() dto: CreateOrderDTO, @Req() req: Request) {
    return this.orderService.createOrder(dto, (req.user as IJWTInfo)._id);
  }

  @Get('/dashboard/status/:status')
  getOrdersTableDashboard(
    @Param('status') status: OrderStatus,
    @Query() query: QueryGetOrdersDashboard,
  ) {
    return this.orderService.getOrdresDashboard(status, query);
  }

  @ApiBearerAuth('access_token')
  @UseGuards(JwtGuard)
  @Get('/detail/:id')
  getOrderById(@Param('id') id: OrderStatus, @Req() req: Request) {
    return this.orderService.getOrderById(
      id,
      (req.user as IJWTInfo).roles.includes(Role.Admin),
      (req.user as IJWTInfo)._id,
    );
  }

  @ApiBearerAuth('access_token')
  @UseGuards(JwtGuard)
  @Get('/status/:status')
  getOrders(@Param('status') status: OrderStatus, @Req() req: Request) {
    return this.orderService.getOrders(status, (req.user as IJWTInfo)._id);
  }

  @Get('/daily-report')
  getOrderDailyReport() {
    return this.orderService.getOrderDailyReport();
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

  @Post('/refund/:orderId')
  refundPaymentWithMomo(@Param('orderId', ValidateMongoId) orderId: string) {
    return this.orderService.refundPaymentWithMomo(orderId);
  }

  // @Post('/create-sample-orders')
  // createSampleOrder() {
  //   return this.orderService.createTempOrders();
  // }

  // @Post('/create-data-sales-quantity')
  // createDataSalesQuantity() {
  //   return this.orderService.createDataSalesQuantity();
  // }

  @Post('/revenure-or-refund-follow-time')
  getOrderRevenueFollowTime(@Body() body: OrderTimeReportDTO) {
    return this.orderService.getOrdersRevenueOrRefundFollowTime(
      body.timeReport,
      body.status,
    );
  }

  @Post('/overview-follow-time')
  getOrderOverviewFollowTime(@Body() body: OrderOverviewDTO) {
    return this.orderService.getOrderOverviewFollowTime(body.timeReport);
  }
}

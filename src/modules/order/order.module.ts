import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderItem, OrderItemSchema, OrderSchema } from '../../schemas';
import { ProductModule } from '../product/product.module';
import { HttpModule } from '@nestjs/axios';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { OrderProfile } from './order.profile';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: OrderItem.name, schema: OrderItemSchema },
    ]),
    ProductModule,
    HttpModule,
    CloudinaryModule,
  ],
  providers: [OrderService, OrderProfile],
  controllers: [OrderController],
  exports: [OrderService],
})
export class OrderModule {}

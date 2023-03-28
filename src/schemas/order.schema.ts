import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { SchemaTimestampsConfig } from 'mongoose';
import { OrderStatus, PaymentMethod } from '../constances/enum';
import { AddressDocument } from './address.schema';
import { OrderItemDocument } from './orderItem.schema';
import { UserDocument } from './user.schema';

export type OrderDocument = Order & Document & SchemaTimestampsConfig;

@Schema({
  timestamps: true,
})
export class Order {
  _id: string;

  @Prop({
    type: String,
    unique: true,
  })
  orderId: string;

  @Prop([
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OrderItem',
    },
  ])
  orderItems: OrderItemDocument[] | string[];

  @Prop({
    type: mongoose.Schema.Types.Date,
  })
  date: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  })
  user: UserDocument | string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Address',
  })
  address: AddressDocument | string;

  @Prop({
    type: String,
    enum: PaymentMethod,
  })
  paymentMethod: PaymentMethod;

  @Prop({
    type: Number,
  })
  shippingFee: number;

  @Prop({
    type: Number,
    default: 0,
  })
  transId: number;

  @Prop({
    type: String,
    enum: OrderStatus,
  })
  status: OrderStatus;

  @Prop({
    type: Boolean,
    default: false,
  })
  refund: boolean;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

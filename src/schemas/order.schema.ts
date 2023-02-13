import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { SchemaTimestampsConfig } from 'mongoose';
import { Gender } from '../constances/enum';
import { AddressDocument } from './address.schema';
import { UserDocument } from './user.schema';

export type OrderDocument = Order & Document & SchemaTimestampsConfig;

@Schema({
  timestamps: true,
})
export class Order {
  _id: string;

  @Prop([
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OrderItem',
    },
  ])
  orderItems: OrderDocument[] | string[];

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
  })
  status: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

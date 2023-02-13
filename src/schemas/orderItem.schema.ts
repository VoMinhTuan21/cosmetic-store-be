import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { ProductItemDocument } from './productItem.schema';

export type OrderItemDocument = OrderItem & Document;

@Schema()
export class OrderItem {
  _id: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductItem',
  })
  productItem: ProductItemDocument | string;

  @Prop({
    type: Number,
  })
  price: number;

  @Prop({
    type: Number,
  })
  quantity: number;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

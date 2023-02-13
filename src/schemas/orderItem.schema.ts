import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type OrderItemDocument = OrderItem & Document;

@Schema()
export class OrderItem {
  _id: string;

  @Prop({
    type: String,
  })
  product: string;

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

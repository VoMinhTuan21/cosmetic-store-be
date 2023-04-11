import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { SchemaTimestampsConfig } from 'mongoose';

export type SalesQuantityDocument = SalesQuantity &
  Document &
  SchemaTimestampsConfig;

@Schema({
  timestamps: true,
})
export class SalesQuantity {
  _id: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductItem',
  })
  productItem: string;

  @Prop({
    type: Number,
  })
  sold: number;
}

export const SalesQuantitySchema = SchemaFactory.createForClass(SalesQuantity);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { SchemaTimestampsConfig } from 'mongoose';
import { ProductItemDocument } from './productItem.schema';
import { VariationDocument } from './variation.schema';

export type PromotionDocument = Promotion & Document & SchemaTimestampsConfig;

@Schema({
  timestamps: true,
})
export class Promotion {
  _id: string;

  @Prop({
    type: mongoose.Schema.Types.Date,
  })
  start: Date;

  @Prop({
    type: mongoose.Schema.Types.Date,
  })
  end: Date;

  @Prop({
    type: Number,
  })
  discountRate: number;

  @Prop([
    {
      type: mongoose.Schema.Types.ObjectId,
    },
  ])
  productItem: ProductItemDocument[] | string[];
}

export const PromotionSchema = SchemaFactory.createForClass(Promotion);

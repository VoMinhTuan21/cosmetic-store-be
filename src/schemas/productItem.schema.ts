import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { SchemaTimestampsConfig } from 'mongoose';
import { VariationOptionDocument } from './variationOption.schema';

export type ProductItemDocument = ProductItem &
  Document &
  SchemaTimestampsConfig;

@Schema({
  timestamps: true,
})
export class ProductItem {
  _id: string;

  @Prop({
    type: Number,
  })
  price: number;

  @Prop({
    type: Number,
  })
  quantity: number;

  @Prop({
    type: String,
  })
  thumbnail: string;

  @Prop([
    {
      type: String,
    },
  ])
  images: string[];

  @Prop([
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VariationOption',
    },
  ])
  productConfigurations: VariationOptionDocument[] | string[];
}

export const ProductItemSchema = SchemaFactory.createForClass(ProductItem);

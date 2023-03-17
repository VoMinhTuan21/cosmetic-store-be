import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { SchemaTimestampsConfig } from 'mongoose';
import { CommentDocument } from './comment.schema';
import { TagDocument } from './tag.schema';
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

  @Prop([
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tag',
    },
  ])
  tags: TagDocument[] | string[];

  @Prop({
    type: Number,
    default: 0,
  })
  rating: number;

  @Prop([
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
    },
  ])
  comments: CommentDocument[] | string[];
}

export const ProductItemSchema = SchemaFactory.createForClass(ProductItem);

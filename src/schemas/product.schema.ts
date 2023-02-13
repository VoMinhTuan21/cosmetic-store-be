import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { SchemaTimestampsConfig } from 'mongoose';
import { Gender } from '../constances/enum';
import { CategoryDocument } from './category.schema';

export type ProductDocument = Product & Document & SchemaTimestampsConfig;

@Schema({
  timestamps: true,
})
export class Product {
  _id: string;

  @Prop({
    type: Array<ITranslate>,
  })
  name: ITranslate[];

  @Prop({
    type: Array<ITranslate>,
  })
  description: ITranslate[];

  @Prop({
    type: Number,
    default: 0,
  })
  rating: number;

  @Prop([
    {
      type: String,
    },
  ])
  comments: string[];

  @Prop([
    {
      type: String,
    },
  ])
  productItems: string[];

  @Prop([
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    },
  ])
  categories: CategoryDocument[] | string[];
}

export const ProductSchema = SchemaFactory.createForClass(Product);

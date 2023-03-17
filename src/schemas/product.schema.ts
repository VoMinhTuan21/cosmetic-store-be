import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { SchemaTimestampsConfig } from 'mongoose';
import { BrandDocument } from './brand.schema';
import { CategoryDocument } from './category.schema';
import { ProductItemDocument } from './productItem.schema';
import { VariationDocument } from './variation.schema';

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

  @Prop([
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductItem',
    },
  ])
  productItems: ProductItemDocument[] | string[];

  @Prop([
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    },
  ])
  categories: CategoryDocument[] | string[];

  @Prop([
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Variation',
    },
  ])
  variations: VariationDocument[] | string[];

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
  })
  brand: BrandDocument | string;
}

const ProductSchema = SchemaFactory.createForClass(Product);

ProductSchema.index({ 'name.value': 'text', 'description.value': 'text' });

export { ProductSchema };

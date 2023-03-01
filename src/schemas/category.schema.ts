import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { SchemaTimestampsConfig } from 'mongoose';

export type CategoryDocument = Category & Document & SchemaTimestampsConfig;

@Schema({
  timestamps: true,
})
export class Category {
  _id: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
  })
  parentCategory: CategoryDocument | string;

  @Prop({
    type: String,
  })
  icon: string;

  @Prop({
    type: Array<ITranslate>,
  })
  name: ITranslate[];
}

export const CategorySchema = SchemaFactory.createForClass(Category);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { SchemaTimestampsConfig } from 'mongoose';
import { VariationDocument } from './variation.schema';

export type VariationOptionDocument = VariationOption &
  Document &
  SchemaTimestampsConfig;

@Schema({
  timestamps: true,
})
export class VariationOption {
  _id: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Variation',
  })
  parentVariation: VariationDocument;

  @Prop({
    type: Array<ITranslate>,
  })
  value: ITranslate[];
}

export const VariationOptionSchema =
  SchemaFactory.createForClass(VariationOption);

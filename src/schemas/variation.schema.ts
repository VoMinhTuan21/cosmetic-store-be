import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTimestampsConfig } from 'mongoose';

export type VariationDocument = Variation & Document & SchemaTimestampsConfig;

@Schema({
  timestamps: true,
})
export class Variation {
  _id: string;

  @Prop({
    type: Array<ITranslate>,
  })
  name: ITranslate[];
}

export const VariationSchema = SchemaFactory.createForClass(Variation);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTimestampsConfig } from 'mongoose';

export type BrandDocument = Brand & Document & SchemaTimestampsConfig;

@Schema({
  timestamps: true,
})
export class Brand {
  _id: string;

  @Prop({
    type: String,
  })
  name: string;

  @Prop({
    type: String,
  })
  logo: string;
}

export const BrandSchema = SchemaFactory.createForClass(Brand);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { SchemaTimestampsConfig } from 'mongoose';
import { TagGroupDocument } from './tagGroup.schema';

export type SettingDocument = Setting & Document & SchemaTimestampsConfig;

@Schema({
  timestamps: true,
})
export class Setting {
  _id: string;

  @Prop({
    type: Number,
  })
  shippingFeePerKm: number;
}

export const SettingSchema = SchemaFactory.createForClass(Setting);

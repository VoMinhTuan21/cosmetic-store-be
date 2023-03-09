import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTimestampsConfig } from 'mongoose';

export type TagDocument = Tag & Document & SchemaTimestampsConfig;

@Schema({
  timestamps: true,
})
export class Tag {
  _id: string;

  @Prop({
    type: String,
  })
  name: string;
}

export const TagSchema = SchemaFactory.createForClass(Tag);

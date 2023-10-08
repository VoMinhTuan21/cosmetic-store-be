import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTimestampsConfig } from 'mongoose';

export type TagGroupDocument = TagGroup & Document & SchemaTimestampsConfig;

@Schema({
  timestamps: true,
})
export class TagGroup {
  _id: string;

  @Prop({
    type: String,
  })
  name: string;
}

export const TagGroupSchema = SchemaFactory.createForClass(TagGroup);

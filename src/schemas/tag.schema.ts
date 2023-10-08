import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { SchemaTimestampsConfig } from 'mongoose';
import { TagGroupDocument } from './tagGroup.schema';

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

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TagGroup',
  })
  parent: TagGroupDocument | string;

  @Prop({
    type: Number,
  })
  weight: number;
}

export const TagSchema = SchemaFactory.createForClass(Tag);

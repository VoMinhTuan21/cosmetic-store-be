import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { mongo, SchemaTimestampsConfig } from 'mongoose';
import { Gender } from '../constances/enum';
import { OrderItemDocument } from './orderItem.schema';
import { UserDocument } from './user.schema';

export type CommentDocument = Comment & Document & SchemaTimestampsConfig;

@Schema({
  timestamps: true,
})
export class Comment {
  _id: string;

  @Prop({
    type: String,
  })
  content: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  })
  user: UserDocument | string;

  @Prop({
    type: Number,
  })
  rate: number;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OrderItem',
  })
  orderItem: OrderItemDocument | string;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

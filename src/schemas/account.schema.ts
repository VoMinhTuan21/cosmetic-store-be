import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { SchemaTimestampsConfig } from 'mongoose';
import { UserDocument } from './user.schema';

export type AccountDocument = Account & Document & SchemaTimestampsConfig;

@Schema({
  timestamps: true,
})
export class Account {
  _id: string;

  @Prop({
    type: String,
  })
  access_token?: string;

  @Prop({
    type: String,
  })
  token_type?: string;

  @Prop({
    type: String,
  })
  id_token?: string;

  @Prop({
    type: String,
  })
  refresh_token?: string;

  @Prop({
    type: String,
  })
  scope?: string;

  @Prop({
    type: Number,
  })
  expires_at?: number;

  @Prop({
    type: String,
  })
  session_state?: string;

  @Prop({
    type: String,
    required: true,
  })
  providerAccountId: string;

  @Prop({
    type: String,
    required: true,
  })
  provider: string;

  @Prop({
    type: String,
    enum: ['oauth', 'email', 'credentials'],
    required: true,
  })
  type: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  })
  userId: UserDocument | string;
}

export const AccountSchema = SchemaFactory.createForClass(Account);

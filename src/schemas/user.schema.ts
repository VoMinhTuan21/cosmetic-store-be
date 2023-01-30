import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { SchemaTimestampsConfig } from 'mongoose';
import { Gender } from '../constances/enum';

export type UserDocument = User & Document & SchemaTimestampsConfig;

@Schema({
  timestamps: true,
})
export class User {
  _id: string;

  @Prop({
    type: String,
  })
  name: string;

  @Prop({
    type: mongoose.Schema.Types.Date,
  })
  birthday: string;

  @Prop({
    type: String,
  })
  image: string;

  @Prop({
    unique: true,
    type: String,
    required: true,
  })
  email: string;

  @Prop({
    type: String,
  })
  password: string;

  @Prop({
    type: String,
  })
  phone: string;

  @Prop({
    type: String,
    enum: Gender,
  })
  gender: Gender;
}

export const UserSchema = SchemaFactory.createForClass(User);

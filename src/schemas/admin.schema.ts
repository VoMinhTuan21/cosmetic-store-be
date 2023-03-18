import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { SchemaTimestampsConfig } from 'mongoose';
import { AdminRole, Gender } from '../constances/enum';

export type AdminDocument = Admin & Document & SchemaTimestampsConfig;

@Schema({
  timestamps: true,
})
export class Admin {
  _id: string;

  @Prop({
    type: String,
  })
  name: string;

  @Prop({
    type: String,
    unique: true,
  })
  email: string;

  @Prop({
    type: String,
  })
  password: string;

  @Prop({
    type: mongoose.Schema.Types.Date,
  })
  birthday: string;

  @Prop({
    type: String,
    enum: Gender,
  })
  gender: Gender;

  @Prop({
    type: String,
    enum: AdminRole,
  })
  role: AdminRole;
}

export const AdminSchema = SchemaFactory.createForClass(Admin);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTimestampsConfig } from 'mongoose';

export type OTPVerificationDocument = OTPVerification &
  Document &
  SchemaTimestampsConfig;

@Schema({
  timestamps: true,
})
export class OTPVerification {
  _id: string;

  @Prop({
    type: String,
  })
  email: string;

  @Prop({
    type: String,
  })
  otp: string;

  @Prop({
    type: Date,
    default: Date.now(),
    expires: 600,
  })
  expire_at: Date;
}

export const OTPVerificationSchema =
  SchemaFactory.createForClass(OTPVerification);

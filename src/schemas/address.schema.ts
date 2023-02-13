import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Gender } from '../constances/enum';

export type AddressDocument = Address & Document;

@Schema()
export class Address {
  _id: string;

  @Prop({
    type: String,
  })
  name: string;

  @Prop({
    type: String,
  })
  phone: string;

  @Prop({
    type: String,
  })
  province: string;

  @Prop({
    type: String,
  })
  district: string;

  @Prop({
    type: String,
  })
  ward: string;

  @Prop({
    type: String,
  })
  specificAddress: string;

  @Prop({
    type: Boolean,
  })
  default: boolean;
}

export const AddressSchema = SchemaFactory.createForClass(Address);

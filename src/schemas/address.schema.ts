import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type AddressDocument = Address & Document;

@Schema({ _id: false })
class Coordinates {
  @Prop({ type: Number })
  latitude: number;
  @Prop({ type: Number })
  longitude: number;
}

const CoordinatesSchema = SchemaFactory.createForClass(Coordinates);

@Schema({
  timestamps: true,
})
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
    type: CoordinatesSchema,
  })
  coordinates: ICoordinates;

  @Prop({
    type: Boolean,
    default: false,
  })
  default: boolean;
}

export const AddressSchema = SchemaFactory.createForClass(Address);

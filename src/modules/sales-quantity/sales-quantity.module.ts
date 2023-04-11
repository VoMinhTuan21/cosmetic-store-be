import { Module } from '@nestjs/common';
import { SalesQuantityService } from './sales-quantity.service';
import {
  SalesQuantity,
  SalesQuantitySchema,
} from '../../schemas/salesQuantity.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SalesQuantity.name, schema: SalesQuantitySchema },
    ]),
  ],
  providers: [SalesQuantityService],
  exports: [SalesQuantityService],
})
export class SalesQuantityModule {}

import { Module } from '@nestjs/common';
import { VariationService } from './variation.service';
import { VariationController } from './variation.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Variation,
  VariationOption,
  VariationOptionSchema,
  VariationSchema,
} from '../../schemas';
import { VariationOptionProfile, VariationProfile } from './variation.profile';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Variation.name, schema: VariationSchema },
      { name: VariationOption.name, schema: VariationOptionSchema },
    ]),
  ],
  providers: [VariationService, VariationProfile, VariationOptionProfile],
  controllers: [VariationController],
})
export class VariationModule {}

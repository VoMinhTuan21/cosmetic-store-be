import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Variation,
  VariationDocument,
  VariationOptionDocument,
} from '../../schemas';

@Injectable()
export class VariationService {
  constructor(
    @InjectModel(Variation.name)
    private readonly variationModel: Model<VariationDocument>,
    @InjectModel(Variation.name)
    private readonly variationOptionModel: Model<VariationOptionDocument>,
  ) {}
}

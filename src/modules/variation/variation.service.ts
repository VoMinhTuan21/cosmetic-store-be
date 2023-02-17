import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import {
  CREATE_VARIATION_OPTION_SUCCESS,
  CREATE_VARIATION_SUCCESS,
  ERROR_CREATE_VARIATION,
  ERROR_CREATE_VARIATION_OPTION,
  ERROR_VARIATION_EXISTED,
  ERROR_VARIATION_OPTION_EXISTED,
} from '../../constances';
import { CreateVariation, CreateVariationOption } from '../../dto/request';
import {
  Variation,
  VariationDocument,
  VariationOption,
  VariationOptionDocument,
} from '../../schemas';
import {
  handleResponseFailure,
  handleResponseSuccess,
} from '../../utils/handle-response';

@Injectable()
export class VariationService {
  constructor(
    @InjectModel(Variation.name)
    private readonly variationModel: Model<VariationDocument>,
    @InjectModel(VariationOption.name)
    private readonly variationOptionModel: Model<VariationOptionDocument>,
  ) {}

  async createVariation(dto: CreateVariation) {
    try {
      const existedVariation = await this.variationModel.findOne({
        name: { $all: dto.name },
      });

      if (existedVariation) {
        return handleResponseFailure({
          error: ERROR_VARIATION_EXISTED,
          statusCode: HttpStatus.NOT_ACCEPTABLE,
        });
      }

      const variation = await this.variationModel.create({
        name: dto.name,
      });

      return handleResponseSuccess({
        data: variation,
        message: CREATE_VARIATION_SUCCESS,
      });
    } catch (error) {
      return handleResponseFailure({
        error: error.response?.error || ERROR_CREATE_VARIATION,
        statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
      });
    }
  }

  async createVariationOption(dto: CreateVariationOption) {
    try {
      const existedVariationOption = await this.variationOptionModel.findOne({
        parentVariation: new mongoose.Types.ObjectId(dto.parentVariation),
        value: { $all: dto.name },
      });

      if (existedVariationOption) {
        return handleResponseFailure({
          error: ERROR_VARIATION_OPTION_EXISTED,
          statusCode: HttpStatus.NOT_ACCEPTABLE,
        });
      }

      const variationOption = await this.variationOptionModel.create({
        parentVariation: dto.parentVariation,
        value: dto.name,
      });

      return handleResponseSuccess({
        data: variationOption,
        message: CREATE_VARIATION_OPTION_SUCCESS,
      });
    } catch (error) {
      return handleResponseFailure({
        error: error.response?.error || ERROR_CREATE_VARIATION_OPTION,
        statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
      });
    }
  }
}
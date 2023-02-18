import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import {
  CREATE_VARIATION_OPTION_SUCCESS,
  CREATE_VARIATION_SUCCESS,
  ERROR_CREATE_VARIATION,
  ERROR_CREATE_VARIATION_OPTION,
  ERROR_GET_VARIATION,
  ERROR_GET_VARIATION_OPTION,
  ERROR_VARIATION_EXISTED,
  ERROR_VARIATION_OPTION_EXISTED,
  GET_VARIATION_OPTION_SUCCESS,
  GET_VARIATION_SUCCESS,
} from '../../constances';
import { CreateVariation, CreateVariationOption } from '../../dto/request';
import { VariationOptionResDTO, VariationResDTO } from '../../dto/response';
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

  async get() {
    try {
      const variations = (await this.variationModel.find(
        {},
        { _id: 1, name: 1 },
      )) as VariationResDTO[];
      return handleResponseSuccess({
        data: variations,
        message: GET_VARIATION_SUCCESS,
      });
    } catch (error) {
      return handleResponseFailure({
        error: ERROR_GET_VARIATION,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }
  }

  async getVaritionOptions(parentId: string) {
    try {
      const variationOptions = (await this.variationOptionModel.find(
        {
          parentElement: new mongoose.Types.ObjectId(parentId),
        },
        { value: 1 },
      )) as VariationOptionResDTO[];

      return handleResponseSuccess({
        data: variationOptions,
        message: GET_VARIATION_OPTION_SUCCESS,
      });
    } catch (error) {
      return handleResponseFailure({
        error: ERROR_GET_VARIATION_OPTION,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }
  }
}

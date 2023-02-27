import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import {
  CREATE_VARIATION_OPTION_SUCCESS,
  CREATE_VARIATION_SUCCESS,
  DELETE_VARIATION_OPTION_SUCCESS,
  ERROR_CREATE_VARIATION,
  ERROR_CREATE_VARIATION_OPTION,
  ERROR_DELETE_VARIATION_OPTION,
  ERROR_GET_VARIATION,
  ERROR_GET_VARIATION_OPTION,
  ERROR_GET_VARIATION_TABLE,
  ERROR_VARIATION_EXISTED,
  ERROR_VARIATION_OPTION_EXISTED,
  GET_VARIATION_OPTION_SUCCESS,
  GET_VARIATION_SUCCESS,
  GET_VARIATION_TABLE_SUCCESS,
} from '../../constances';
import { Language } from '../../constances/enum';
import { CreateVariation, CreateVariationOptionsDTO } from '../../dto/request';
import { VariationOptionResDTO, VariationResDTO } from '../../dto/response';
import { VariationsTableResDTO } from '../../dto/response/variation.dto';
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
    @InjectMapper() private readonly mapper: Mapper,
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

      const options = [];

      if (dto.options) {
        for (const option of dto.options) {
          const variationOption = await this.createVariationOption(
            variation._id,
            [
              {
                language: Language.vi,
                value: option.vi,
              },
              {
                language: Language.en,
                value: option.en,
              },
            ],
          );

          if (variationOption) {
            options.push(variationOption.data);
          }
        }
      }

      return handleResponseSuccess({
        data: {
          variation: this.mapper.map(variation, Variation, VariationResDTO),
          variationOptions: options,
        },
        message: CREATE_VARIATION_SUCCESS,
      });
    } catch (error) {
      return handleResponseFailure({
        error: error.response?.error || ERROR_CREATE_VARIATION,
        statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
      });
    }
  }

  async createVariationOption(parentVariation: string, name: ITranslate[]) {
    try {
      const existedVariationOption = await this.variationOptionModel.findOne({
        parentVariation: new mongoose.Types.ObjectId(parentVariation),
        value: { $all: name },
      });

      if (existedVariationOption) {
        return handleResponseFailure({
          error: ERROR_VARIATION_OPTION_EXISTED,
          statusCode: HttpStatus.NOT_ACCEPTABLE,
        });
      }

      const variationOption = await this.variationOptionModel.create({
        parentVariation: parentVariation,
        value: name,
      });

      return handleResponseSuccess({
        data: this.mapper.map(
          variationOption,
          VariationOption,
          VariationOptionResDTO,
        ),
        message: CREATE_VARIATION_OPTION_SUCCESS,
      });
    } catch (error) {
      console.log('error: ', error);
      return handleResponseFailure({
        error: error.response?.error || ERROR_CREATE_VARIATION_OPTION,
        statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
      });
    }
  }

  async createVariationOptions(dto: CreateVariationOptionsDTO) {
    try {
      const options = [];
      for (const option of dto.options) {
        const newOption = await this.createVariationOption(
          dto.parentVariation,
          [
            {
              language: 'vi',
              value: option.vi,
            },
            {
              language: 'en',
              value: option.en,
            },
          ],
        );

        if (newOption) {
          options.push(
            this.mapper.map(
              newOption.data,
              VariationOption,
              VariationOptionResDTO,
            ),
          );
        }
      }

      return handleResponseSuccess({
        data: options,
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
      const variation = await this.variationModel.findById(parentId, {
        _id: 1,
        name: 1,
      });

      const variationOptions = (await this.variationOptionModel.find(
        {
          parentVariation: parentId,
        },
        { value: 1 },
      )) as VariationOptionResDTO[];

      return handleResponseSuccess({
        data: { variation, variationOptions },
        message: GET_VARIATION_OPTION_SUCCESS,
      });
    } catch (error) {
      return handleResponseFailure({
        error: ERROR_GET_VARIATION_OPTION,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }
  }

  async getVariationsTable() {
    try {
      const variations = await this.variationModel.find(
        {},
        { _id: 1, name: 1 },
      );
      const res: VariationsTableResDTO[] = [];

      for (const variation of variations) {
        const options = await this.variationOptionModel.find({
          parentVariation: variation._id,
        });
        res.push({
          variation: this.mapper.map(variation, Variation, VariationResDTO),
          variationOptions: this.mapper.mapArray(
            options,
            VariationOption,
            VariationOptionResDTO,
          ),
        });
      }

      return handleResponseSuccess({
        data: res,
        message: GET_VARIATION_TABLE_SUCCESS,
      });
    } catch (error) {
      return handleResponseFailure({
        error: ERROR_GET_VARIATION_TABLE,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }
  }

  async deleteVariationOption(id: string) {
    try {
      await this.variationOptionModel.findByIdAndDelete(id);
      return handleResponseSuccess({
        data: id,
        message: DELETE_VARIATION_OPTION_SUCCESS,
      });
    } catch (error) {
      return handleResponseFailure({
        error: ERROR_DELETE_VARIATION_OPTION,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }
  }
}

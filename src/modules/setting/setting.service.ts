import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Setting, SettingDocument } from '../../schemas/setting.schema';
import {
  handleResponseFailure,
  handleResponseSuccess,
} from '../../utils/handle-response';
import {
  ERROR_GET_SHIPPING_FEE_PER_KM,
  ERROR_UPDATE_SHIPPING_FEE_PER_KM,
  GET_SHIPPING_FEE_PER_KM_SUCCESS,
  UPDATE_SHIPPING_FEE_PER_KM_SUCCESS,
} from '../../constances';
import { UpdateShippingFeePeerKmDTO } from '../../dto/request';

@Injectable()
export class SettingService {
  constructor(
    @InjectModel(Setting.name)
    private readonly settingModel: Model<SettingDocument>,
  ) {}

  async create() {
    await this.settingModel.create({
      shippingFeePerKm: 5000,
    });
  }

  async getShippingFeePerKm() {
    try {
      const setting = await this.settingModel.find();
      return handleResponseSuccess({
        data: setting[0].shippingFeePerKm,
        message: GET_SHIPPING_FEE_PER_KM_SUCCESS,
      });
    } catch (error) {
      return handleResponseFailure({
        error: ERROR_GET_SHIPPING_FEE_PER_KM,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }
  }

  async updateShippingFeePerKm(dto: UpdateShippingFeePeerKmDTO) {
    try {
      const setting = await this.settingModel.findOne({});

      setting.shippingFeePerKm = dto.fee;
      await setting.save();

      return handleResponseSuccess({
        data: dto.fee,
        message: UPDATE_SHIPPING_FEE_PER_KM_SUCCESS,
      });
    } catch (error) {
      return handleResponseFailure({
        error: ERROR_UPDATE_SHIPPING_FEE_PER_KM,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }
  }
}

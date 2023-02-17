import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  CREATE_BANRD_SUCCESS,
  DELETE_BRAND_SUCCESS,
  ERROR_BRAND_NAME_EXISTED,
  ERROR_BRAND_NOT_EXIST,
  ERROR_CREATE_BRAND,
  ERROR_DELETE_BRAND,
  ERROR_NO_FIELD_TO_UPDATE,
  ERROR_UPDATE_BRAND,
  UPDATE_BRAND_SUCCESS,
} from '../../constances/brand-res-message';
import { Brand, BrandDocument } from '../../schemas';
import {
  handleResponseFailure,
  handleResponseSuccess,
} from '../../utils/handle-response';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class BrandService {
  constructor(
    @InjectModel(Brand.name) private brandModel: Model<BrandDocument>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async create(name: string, logo: Express.Multer.File) {
    try {
      const brandFound = await this.brandModel.findOne({ name: name });
      if (brandFound) {
        return handleResponseFailure({
          error: ERROR_BRAND_NAME_EXISTED,
          statusCode: HttpStatus.CONFLICT,
        });
      }

      const logoURL = await this.cloudinaryService.uploadImage(
        logo,
        'hygge/brand',
      );

      const newBrand = await this.brandModel.create({
        name: name,
        logo: logoURL.public_id,
      });

      return handleResponseSuccess({
        message: CREATE_BANRD_SUCCESS,
        data: newBrand,
      });
    } catch (error) {
      console.log('error: ', error);
      return handleResponseFailure({
        error: error.response?.error || ERROR_CREATE_BRAND,
        statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
      });
    }
  }

  async update(brandId: string, name?: string, logo?: Express.Multer.File) {
    try {
      const brandFound = await this.brandModel.findById(brandId);
      if (!brandFound) {
        return handleResponseFailure({
          error: ERROR_BRAND_NOT_EXIST,
          statusCode: HttpStatus.NOT_FOUND,
        });
      }

      if (!name && !logo) {
        return handleResponseFailure({
          error: ERROR_NO_FIELD_TO_UPDATE,
          statusCode: HttpStatus.BAD_REQUEST,
        });
      }

      if (name) {
        var regex = new RegExp(['^', name, '$'].join(''), 'i');
        const brandNameFound = await this.brandModel.findOne({ name: regex });
        if (brandNameFound) {
          return handleResponseFailure({
            error: ERROR_BRAND_NAME_EXISTED,
            statusCode: HttpStatus.BAD_REQUEST,
          });
        }

        brandFound.name = name;
      }

      if (logo) {
        this.cloudinaryService.deleteImage(brandFound.logo);

        const { public_id } = await this.cloudinaryService.uploadImage(
          logo,
          'hygge/brand',
        );
        brandFound.logo = public_id;
      }

      await brandFound.save();

      return handleResponseSuccess({
        message: UPDATE_BRAND_SUCCESS,
        data: brandFound,
      });
    } catch (error) {
      console.log('error: ', error);
      return handleResponseFailure({
        error: error.response?.error || ERROR_UPDATE_BRAND,
        statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
      });
    }
  }

  async delete(brandId: string) {
    try {
      const deletedBrand = await this.brandModel.findByIdAndDelete(brandId);
      this.cloudinaryService.deleteImage(deletedBrand.logo);

      return handleResponseSuccess({
        message: DELETE_BRAND_SUCCESS,
        data: brandId,
      });
    } catch (error) {
      console.log('error: ', error);
      return handleResponseFailure({
        error: error.response?.error || ERROR_DELETE_BRAND,
        statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
      });
    }
  }
}

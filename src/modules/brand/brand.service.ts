import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ERROR_BRAND_NAME_EXISTED,
  CREATE_BANRD_SUCCESS,
  ERROR_CREATE_BRAND,
  ERROR_BRAND_NOT_EXIST,
  ERROR_NO_FIELD_TO_UPDATE,
  UPDATE_BRAND_SUCCESS,
  ERROR_UPDATE_BRAND,
  DELETE_BRAND_SUCCESS,
  ERROR_DELETE_BRAND,
  GET_BRAND_SUCCESSS,
  ERROR_GET_BRAND,
  GET_BRANDS_SUCCESS,
  ERROR_GET_BRANDS,
} from '../../constances';
import { BrandNameDTO, BrandResDTO } from '../../dto/response';
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
    @InjectMapper() private readonly mapper: Mapper,
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

      newBrand.logo = await this.cloudinaryService.getImageUrl(newBrand.logo);

      return handleResponseSuccess({
        message: CREATE_BANRD_SUCCESS,
        data: this.mapper.map(newBrand, Brand, BrandResDTO),
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
        const regex = new RegExp(['^', name, '$'].join(''), 'i');
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

      brandFound.logo = await this.cloudinaryService.getImageUrl(
        brandFound.logo,
      );

      return handleResponseSuccess({
        message: UPDATE_BRAND_SUCCESS,
        data: this.mapper.map(brandFound, Brand, BrandResDTO),
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

  async getListBrandName() {
    try {
      const brands = (await this.brandModel.find(
        {},
        { _id: 1, name: 1 },
      )) as BrandNameDTO[];
      return handleResponseSuccess({
        data: brands,
        message: GET_BRAND_SUCCESSS,
      });
    } catch (error) {
      return handleResponseFailure({
        error: ERROR_GET_BRAND,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }
  }

  async getBrands() {
    try {
      const brands = await this.brandModel.find({});

      for (const brand of brands) {
        const logo = await this.cloudinaryService.getImageUrl(brand.logo);
        brand.logo = logo;
      }

      return handleResponseSuccess({
        data: this.mapper.mapArray(brands, Brand, BrandResDTO),
        message: GET_BRANDS_SUCCESS,
      });
    } catch (error) {
      return handleResponseFailure({
        error: ERROR_GET_BRANDS,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }
  }
}

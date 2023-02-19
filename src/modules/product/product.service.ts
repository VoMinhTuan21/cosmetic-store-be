import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import {
  ERROR_PRODUCT_ITEM_EXISTED,
  CREATE_PRODUCT_ITEM_SUCCESS,
  ERROR_CREATE_PRODUCT_ITEM,
  ERROR_PRODUCT_EXISTED,
  CREATE_PRODUCT_SUCCESS,
  ERROR_CREATE_PRODUCT,
  GET_PRODUCT_NAMES_SUCCESS,
  ERROR_GET_PRODUCT_NAMES,
} from '../../constances';
import { CreateProductDTO, CreateProductItemDTO } from '../../dto/request';
import {
  Product,
  ProductDocument,
  ProductItem,
  ProductItemDocument,
} from '../../schemas';
import {
  handleResponseFailure,
  handleResponseSuccess,
} from '../../utils/handle-response';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(ProductItem.name)
    private readonly productItemModel: Model<ProductItemDocument>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async createProductItem(dto: CreateProductItemDTO) {
    try {
      const productItems = (await this.productModel.findById(dto.productId))
        .productItems as string[];

      const existedProductItem = await this.productItemModel.find({
        _id: { $in: productItems },
        productConfiguartions: { $all: dto.productConfiguration },
      });

      if (existedProductItem.length > 0) {
        return handleResponseFailure({
          error: ERROR_PRODUCT_ITEM_EXISTED,
          statusCode: HttpStatus.CONFLICT,
        });
      }

      const thumbnail = await this.cloudinaryService.uploadImage(
        dto.thumbnail,
        'hygge/products',
      );
      const images: string[] = [];

      for (const image of dto.images) {
        const { public_id } = await this.cloudinaryService.uploadImage(
          image,
          'hygge/products',
        );
        images.push(public_id);
      }

      const productItem = await this.productItemModel.create({
        price: dto.price,
        thumbnail: thumbnail.public_id,
        images: images,
        productConfiguartions: dto.productConfiguration,
      });

      await this.productModel.findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(dto.productId) },
        {
          $push: { productItems: productItem._id },
        },
      );

      return handleResponseSuccess({
        data: productItem,
        message: CREATE_PRODUCT_ITEM_SUCCESS,
      });
    } catch (error) {
      return handleResponseFailure({
        error: error.response?.error || ERROR_CREATE_PRODUCT_ITEM,
        statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
      });
    }
  }

  async createProduct(dto: CreateProductDTO) {
    try {
      const existed_product = await this.productModel.findOne({
        name: { $all: dto.name },
      });

      if (existed_product) {
        return handleResponseFailure({
          error: ERROR_PRODUCT_EXISTED,
          statusCode: HttpStatus.CONFLICT,
        });
      }

      const product = await this.productModel.create({
        ...dto,
      });

      return handleResponseSuccess({
        data: product,
        message: CREATE_PRODUCT_SUCCESS,
      });
    } catch (error) {
      return handleResponseFailure({
        error: error.response?.error || ERROR_CREATE_PRODUCT,
        statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
      });
    }
  }

  async getProductName() {
    try {
      const list = await this.productModel.find({}, { name: 1, variations: 1 });

      return handleResponseSuccess({
        data: list,
        message: GET_PRODUCT_NAMES_SUCCESS,
      });
    } catch (error) {
      return handleResponseFailure({
        error: ERROR_GET_PRODUCT_NAMES,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }
  }
}

import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { pipeline } from 'stream';
import {
  ERROR_PRODUCT_ITEM_EXISTED,
  CREATE_PRODUCT_ITEM_SUCCESS,
  ERROR_CREATE_PRODUCT_ITEM,
  ERROR_PRODUCT_EXISTED,
  CREATE_PRODUCT_SUCCESS,
  ERROR_CREATE_PRODUCT,
  GET_PRODUCT_NAMES_SUCCESS,
  ERROR_GET_PRODUCT_NAMES,
  GET_PRODUCT_DASHBOARD_TABLE_SUCCESS,
  ERROR_GET_PRODUCT_DASHBOARD_TABLE,
  ERROR_DELETE_PRODUCT_ITEM,
  ERROR_DELETE_PRODUCT,
  DELETE_PRODUCT_SUCCESS,
  ERROR_FIND_PRODUCT_BY_ID,
  FIND_PRODUCT_BY_ID_SUCCESS,
  ERROR_PRODUCT_NOT_FOUND,
  ERROR_UPDATE_PRODUCT,
  UPDATE_PRODUCT_SUCCESS,
} from '../../constances';
import {
  CreateProductDTO,
  CreateProductItemDTO,
  UpdateProductDTO,
} from '../../dto/request';
import { ProductDashboardTableDTO, ProductSimPleDTO } from '../../dto/response';
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
    @InjectMapper() private readonly mapper: Mapper,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async createProductItem(dto: CreateProductItemDTO) {
    try {
      const productItems = (await this.productModel.findById(dto.productId))
        .productItems as string[];

      const existedProductItem = await this.productItemModel.find({
        _id: { $in: productItems },
        productConfigurations: { $all: dto.productConfiguration },
      });

      if (existedProductItem.length > 0) {
        console.log('existedProductItem: ', existedProductItem);
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
        quantity: dto.quantity,
        thumbnail: thumbnail.public_id,
        images: images,
        productConfigurations: dto.productConfiguration,
      });

      await this.productModel.findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(dto.productId) },
        {
          $push: { productItems: productItem._id },
        },
      );

      const newProductItem = (await this.productItemModel.aggregate([
        { $match: { _id: productItem._id } },
        {
          $lookup: {
            from: 'variationoptions',
            foreignField: '_id',
            localField: 'productConfigurations',
            as: 'productConfigurations',
            pipeline: [
              {
                $unwind: '$value',
              },
              { $match: { 'value.language': 'vi' } },
              {
                $replaceRoot: {
                  newRoot: {
                    _id: '$_id',
                    value: '$value.value',
                  },
                },
              },
            ],
          },
        },
        {
          $project: {
            _id: 1,
            price: 1,
            quantity: 1,
            productConfigurations: 1,
          },
        },
      ])) as ICreatedProductItem[];

      return handleResponseSuccess({
        data: {
          productId: dto.productId,
          productItem: newProductItem[0],
        },
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

      const newProduct = (await this.productModel.aggregate([
        { $unwind: '$name' },
        { $match: { 'name.language': 'vi' } },
        { $match: { _id: product._id } },
        {
          $lookup: {
            from: 'categories',
            foreignField: '_id',
            localField: 'categories',
            as: 'categories',
            pipeline: [
              { $unwind: '$name' },
              { $match: { 'name.language': 'vi' } },
              {
                $replaceRoot: {
                  newRoot: {
                    _id: '$_id',
                    name: '$name.value',
                  },
                },
              },
            ],
          },
        },
        {
          $lookup: {
            from: 'brands',
            foreignField: '_id',
            localField: 'brand',
            as: 'brand',
            pipeline: [{ $project: { _id: 1, name: 1 } }],
          },
        },
        { $project: { _id: 1, name: 1, brand: 1, categories: 1 } },
        {
          $replaceRoot: {
            newRoot: {
              _id: '$_id',
              name: '$name.value',
              productItems: '$productItems',
              brand: '$brand',
              categories: '$categories',
            },
          },
        },
      ])) as ICreateProduct[];

      return handleResponseSuccess({
        data: newProduct[0],
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

  async getProductDashboard() {
    try {
      const products = await this.productModel.aggregate([
        { $unwind: '$name' },
        { $match: { 'name.language': 'vi' } },
        {
          $lookup: {
            from: 'productitems',
            localField: 'productItems',
            foreignField: '_id',
            as: 'productItems',
            pipeline: [
              {
                $lookup: {
                  from: 'variationoptions',
                  localField: 'productConfigurations',
                  foreignField: '_id',
                  as: 'productConfigurations',
                  pipeline: [
                    { $unwind: '$value' },
                    { $match: { 'value.language': 'vi' } },
                    // { $project: { value: 1 } },
                    {
                      $replaceRoot: {
                        newRoot: {
                          _id: '$_id',
                          value: '$value.value',
                        },
                      },
                    },
                  ],
                },
              },
              {
                $project: { price: 1, quantity: 1, productConfigurations: 1 },
              },
            ],
          },
        },
        {
          $lookup: {
            from: 'categories',
            localField: 'categories',
            foreignField: '_id',
            as: 'categories',
            pipeline: [
              { $unwind: '$name' },
              { $match: { 'name.language': 'vi' } },
              // { $project: { name: 1 } },
              {
                $replaceRoot: {
                  newRoot: {
                    _id: '$_id',
                    name: '$name.value',
                  },
                },
              },
            ],
          },
        },
        {
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brand',
            pipeline: [{ $project: { name: 1 } }],
          },
        },
        {
          $replaceRoot: {
            newRoot: {
              _id: '$_id',
              name: '$name.value',
              productItems: '$productItems',
              brand: '$brand',
              categories: '$categories',
            },
          },
        },
      ]);

      return handleResponseSuccess<ProductDashboardTableDTO[]>({
        data: products,
        message: GET_PRODUCT_DASHBOARD_TABLE_SUCCESS,
      });
    } catch (error) {
      return handleResponseFailure({
        error: ERROR_GET_PRODUCT_DASHBOARD_TABLE,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }
  }

  async deleteProductItem(productId: string, productItemId: string) {
    try {
      await this.productModel.findByIdAndUpdate(productId, {
        $pull: {
          productItems: productItemId,
        },
      });

      const deletedItem = await this.productItemModel.findByIdAndDelete(
        productItemId,
      );
      this.cloudinaryService.deleteImage(deletedItem.thumbnail);
      deletedItem.images.forEach((publicId) => {
        this.cloudinaryService.deleteImage(publicId);
      });

      return handleResponseSuccess({
        data: {
          productId,
          productItemId,
        },
        message: GET_PRODUCT_DASHBOARD_TABLE_SUCCESS,
      });
    } catch (error) {
      console.log('error: ', error);
      return handleResponseFailure({
        error: ERROR_DELETE_PRODUCT_ITEM,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }
  }

  async deleteProduct(productId: string) {
    try {
      const productDeleted = await this.productModel.findByIdAndDelete(
        productId,
      );
      for (let i = 0; i < productDeleted.productItems.length; i++) {
        const productItemId = productDeleted.productItems[i];
        const productItemDeleted =
          await this.productItemModel.findByIdAndDelete(productItemId);
        this.cloudinaryService.deleteImage(productItemDeleted.thumbnail);
        productItemDeleted.images.forEach((publicId) =>
          this.cloudinaryService.deleteImage(publicId),
        );
      }

      return handleResponseSuccess({
        message: DELETE_PRODUCT_SUCCESS,
        data: productId,
      });
    } catch (error) {
      return handleResponseFailure({
        error: ERROR_DELETE_PRODUCT,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }
  }

  async findProductById(productId: string) {
    try {
      const product = await this.productModel.findById(productId);
      if (product) {
        return handleResponseSuccess({
          message: FIND_PRODUCT_BY_ID_SUCCESS,
          data: this.mapper.map(product, Product, ProductSimPleDTO),
        });
      }

      return handleResponseFailure({
        error: ERROR_PRODUCT_NOT_FOUND,
        statusCode: HttpStatus.NOT_FOUND,
      });
    } catch (error) {
      console.log('error: ', error);
      return handleResponseFailure({
        error: ERROR_FIND_PRODUCT_BY_ID,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }
  }

  async updateProduct(productId: string, body: UpdateProductDTO) {
    try {
      await this.productModel.findByIdAndUpdate(productId, {
        name: body.name,
        description: body.description,
        brand: body.brand,
        categories: body.categories,
      });

      const products = await this.productModel.aggregate([
        { $unwind: '$name' },
        {
          $match: {
            'name.language': 'vi',
            _id: new mongoose.Types.ObjectId(productId),
          },
        },
        {
          $lookup: {
            from: 'categories',
            localField: 'categories',
            foreignField: '_id',
            as: 'categories',
            pipeline: [
              { $unwind: '$name' },
              { $match: { 'name.language': 'vi' } },
              // { $project: { name: 1 } },
              {
                $replaceRoot: {
                  newRoot: {
                    _id: '$_id',
                    name: '$name.value',
                  },
                },
              },
            ],
          },
        },
        {
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brand',
            pipeline: [{ $project: { name: 1 } }],
          },
        },
        {
          $replaceRoot: {
            newRoot: {
              _id: '$_id',
              name: '$name.value',
              brand: '$brand',
              categories: '$categories',
            },
          },
        },
      ]);

      return handleResponseSuccess({
        message: UPDATE_PRODUCT_SUCCESS,
        data: products[0],
      });
    } catch (error) {
      console.log('error: ', error);
      return handleResponseFailure({
        error: ERROR_UPDATE_PRODUCT,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }
  }
}

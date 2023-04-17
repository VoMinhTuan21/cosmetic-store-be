import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { HttpService } from '@nestjs/axios';
import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { customRandom, random } from 'nanoid';
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
  ERROR_FIND_PRODUCT_ITEM,
  FIND_PRODUCT_ITEM_BY_ID_SUCCESS,
  ERROR_UPDATE_PRODUCT_ITEM,
  UPDATE_PRODUCT_ITEM_SUCCESS,
  ERROR_GET_PRODUCT_ITEM,
  GET_PRODUCT_ITEM_SUCCESS,
  ERROR_GET_PRODUCT_ITEM_DETAIL,
  GET_PRODUCT_ITEM_DETAIL_SUCCESS,
  GET_PRODUCT_BY_CATEGORY_SUCCESS,
  ERROR_GET_PRODUCT_BY_CATEGORY,
  GET_PRODUCT_BY_CATEGORY_AND_OPTIONS_SUCCESS,
  ERROR_GET_PRODUCT_BY_CATEGORY_AND_OPTIONS,
  SEARCH_PRODUCT_SUCCESS,
  ERROR_SEARCH_PRODUCT,
  GET_RECOMMEND_CF_SUCCESS,
  ERROR_GET_RECOMMEND_CF,
  ERROR_ADD_PROD_ITEM_QUANTITY,
  ADD_PROD_ITEM_QUANTITY_SUCCESS,
  ERROR_CREATE_COMMENT,
  CREATE_COMMENT_SUCCESS,
  UPDATE_COMMENT_SUCCESS,
  ERROR_UPDATE_COMMENT,
  ERROR_GET_RATING_AND_COMMENT,
  GET_RATING_AND_COMMENT_SUCCESS,
  ERROR_GET_COMMENT_PAGINATION,
  GET_COMMENT_PAGINATION_SUCCESS,
  alphabet,
  GET_RECOMMEND_ITEM_BASED_SUCCESS,
  ERROR_GET_RECOMMEND_ITEM_BASED,
  GET_CATEGORY_ID_OF_PRODUCT_SUCCESS,
  ERROR_GET_CATEGORY_ID_OF_PRODUCT,
} from '../../constances';
import { Search } from '../../constances/enum';
import {
  CommentPagination,
  CreateCommentDTO,
  CreateProductDTO,
  CreateProductItemDTO,
  FilterProductAdminDTO,
  LoadMorePagination,
  PagePagination,
  ProductItemsByBrandAndOptionsDTO,
  ProductItemsByCategoryAndOptionsDTO,
  UpdateCommentDTO,
  UpdateProductDTO,
  UpdateProductItemDTO,
} from '../../dto/request';
import {
  // ProductBrandCartDTO,
  ProductCardDTO,
  ProductSimPleDTO,
} from '../../dto/response';
import {
  BrandDocument,
  CommentDocument,
  Comment,
  Product,
  ProductDocument,
  ProductItem,
  ProductItemDocument,
  VariationDocument,
  VariationOptionDocument,
} from '../../schemas';
import { shuffle } from '../../utils/array';
import {
  handleResponseFailure,
  handleResponseSuccess,
} from '../../utils/handle-response';
import { CategoryService } from '../category/category.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { SalesQuantityService } from '../sales-quantity/sales-quantity.service';
import { SalesQuantityDocument } from '../../schemas/salesQuantity.schema';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(ProductItem.name)
    private readonly productItemModel: Model<ProductItemDocument>,
    @InjectModel(Comment.name)
    private readonly commentModel: Model<CommentDocument>,
    @InjectMapper() private readonly mapper: Mapper,
    private readonly cloudinaryService: CloudinaryService,
    private readonly categoryService: CategoryService,
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
    private readonly salesQuanitytService: SalesQuantityService,
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

      const salesQuantity = await this.salesQuanitytService.create({ sold: 0 });

      const productItem = await this.productItemModel.create({
        price: dto.price,
        quantity: dto.quantity,
        thumbnail: thumbnail.public_id,
        images: images,
        productConfigurations: dto.productConfiguration,
        tags: dto.tags,
        salesQuantity: salesQuantity,
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
          $lookup: {
            from: 'tags',
            foreignField: '_id',
            localField: 'tags',
            as: 'tags',
            pipeline: [
              {
                $project: {
                  _id: 1,
                  name: 1,
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
            tags: 1,
          },
        },
      ])) as IProductItem[];

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
              productId: '$productId',
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

  async getProductDashboard(query: FilterProductAdminDTO) {
    try {
      const condition: { [index: string]: any } = { 'name.language': 'vi' };

      if (query.search && query.type) {
        switch (query.type) {
          case Search.Id:
            condition.productId = query.search;
            break;
          case Search.Name:
            condition['name.value'] = { $regex: query.search, $options: 'i' };
          default:
            break;
        }
      }

      if (query.brands) {
        condition.brand = {
          $in: query.brands.map((item) => new mongoose.Types.ObjectId(item)),
        };
      }

      if (query.category) {
        condition.categories = {
          $in: query.category.map((item) => new mongoose.Types.ObjectId(item)),
        };
      }

      const products = await this.productModel.aggregate([
        { $unwind: '$name' },
        { $match: condition },
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
              productId: '$productId',
            },
          },
        },
      ]);

      return handleResponseSuccess({
        data: {
          data: products.slice(
            query.page * query.limit,
            query.page * query.limit + query.limit,
          ),
          total: products.length,
        },
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

  async findProductItemById(itemId: string, productId: string) {
    try {
      const prodItem = await this.productItemModel.findById(itemId);
      prodItem.thumbnail = await this.cloudinaryService.getImageUrl(
        prodItem.thumbnail,
      );

      const images: string[] = [];

      for (let i = 0; i < prodItem.images.length; i++) {
        const publicId = prodItem.images[i];
        const url = await this.cloudinaryService.getImageUrl(publicId);
        images.push(url);
      }

      const product = await this.productModel.findById(productId, 'variations');

      return handleResponseSuccess({
        message: FIND_PRODUCT_ITEM_BY_ID_SUCCESS,
        data: {
          variations: product.variations,
          prodItem: {
            _id: prodItem._id,
            price: prodItem.price,
            quantity: prodItem.quantity,
            thumbnail: prodItem.thumbnail,
            images,
            productConfigurations: prodItem.productConfigurations,
            tags: prodItem.tags,
          },
        },
      });
    } catch (error) {
      console.log('error: ', error);
      return handleResponseFailure({
        error: error.response?.error || ERROR_FIND_PRODUCT_ITEM,
        statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
      });
    }
  }

  async updateProductItem(itemId: string, dto: UpdateProductItemDTO) {
    try {
      const productItems = (await this.productModel.findById(dto.productId))
        .productItems as string[];

      const existedProductItem = await this.productItemModel.find({
        _id: { $in: productItems },
        productConfigurations: { $all: dto.productConfiguration },
      });

      const prodItem = await this.productItemModel.findById(itemId);

      existedProductItem.forEach((item) => {
        if (item._id.toString() !== prodItem._id.toString()) {
          return handleResponseFailure({
            error: ERROR_PRODUCT_ITEM_EXISTED,
            statusCode: HttpStatus.CONFLICT,
          });
        }
      });

      if (dto.images) {
        const images: string[] = [];

        for (const image of dto.images) {
          const { public_id } = await this.cloudinaryService.uploadImage(
            image,
            'hygge/products',
          );
          images.push(public_id);
        }

        prodItem.images.forEach((publicId) =>
          this.cloudinaryService.deleteImage(publicId),
        );
        prodItem.images.splice(0);
        prodItem.images.push(...images);
      }

      if (dto.thumbnail) {
        const { public_id } = await this.cloudinaryService.uploadImage(
          dto.thumbnail,
          'hygge/products',
        );
        prodItem.thumbnail = public_id;
      }

      prodItem.price = +dto.price;
      prodItem.quantity = +dto.quantity;
      prodItem.productConfigurations = dto.productConfiguration;
      prodItem.tags = dto.tags;
      await prodItem.save();

      const updatedItem = (await this.productItemModel.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(itemId) } },
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
          $lookup: {
            from: 'tags',
            foreignField: '_id',
            localField: 'tags',
            as: 'tags',
            pipeline: [
              {
                $project: {
                  _id: 1,
                  name: 1,
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
            tags: 1,
          },
        },
      ])) as IProductItem[];

      return handleResponseSuccess({
        message: UPDATE_PRODUCT_ITEM_SUCCESS,
        data: {
          productId: dto.productId,
          prodItem: updatedItem[0],
        },
      });
    } catch (error) {
      console.log('error: ', error);
      return handleResponseFailure({
        error: error.response?.error || ERROR_UPDATE_PRODUCT_ITEM,
        statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
      });
    }
  }

  async convertProductDocumentToProductCard(products: ProductDocument[]) {
    const productItems: ProductCardDTO[] = [];
    for (const prod of products) {
      for (const productItem of prod.productItems) {
        const prodItem = productItem as ProductItemDocument;
        // get thumbnail url
        prodItem.thumbnail = await this.cloudinaryService.getImageUrl(
          prodItem.thumbnail,
        );

        // concat name of product with variation name
        let nameVi = '';
        let nameEn = '';
        prod.name.forEach((item) => {
          if (item.language === 'en') {
            nameEn = item.value;
          } else {
            nameVi = item.value;
          }
        });
        for (const config of prodItem.productConfigurations) {
          const configItem = config as VariationOptionDocument;
          configItem.value.forEach((val) => {
            if (val.language === 'en') {
              nameEn += ' ' + val.value;
            } else {
              nameVi += ' ' + val.value;
            }
          });
        }
        productItems.push({
          itemId: prodItem._id,
          productId: prod._id,
          price: prodItem.price,
          thumbnail: prodItem.thumbnail,
          name: [
            { language: 'vi', value: nameVi },
            { language: 'en', value: nameEn },
          ],
          brand: (prod.brand as BrandDocument).name,
          // categories: prod.categories as string[],
          rating: prodItem.rating,
          sold: (prodItem.salesQuantity as SalesQuantityDocument).sold,
          comments: prodItem.comments.length,
        });
      }
    }

    return productItems;
  }

  async getProductItems() {
    try {
      const products = await this.productModel
        .find()
        .populate({
          path: 'productItems',
          populate: {
            path: 'productConfigurations',
            select: '_id value',
          },
          select: '_id price thumbnail productConfigurations',
        })
        // .populate('categories', '_id name')
        .populate('brand', '_id name')
        .select('_id name categories brand');

      const productItems = await this.convertProductDocumentToProductCard(
        products,
      );

      return handleResponseSuccess({
        message: GET_PRODUCT_ITEM_SUCCESS,
        data: shuffle<ProductCardDTO>(productItems),
      });
    } catch (error) {
      console.log('error: ', error);
      return handleResponseFailure({
        error: error.response?.error || ERROR_GET_PRODUCT_ITEM,
        statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
      });
    }
  }

  async extractProducItem(product: ProductDocument) {
    const productItems = [];
    for (const productItem of product.productItems) {
      const prodItem = productItem as ProductItemDocument;
      // get thumbnail and images url
      prodItem.thumbnail = await this.cloudinaryService.getImageUrl(
        prodItem.thumbnail,
      );

      const imgUrls: string[] = [];
      for (const publicId of prodItem.images) {
        const url = await this.cloudinaryService.getImageUrl(publicId);
        imgUrls.push(url);
      }

      // concat name of product with variation name
      let nameVi = '';
      let nameEn = '';
      product.name.forEach((item) => {
        if (item.language === 'en') {
          nameEn = item.value;
        } else {
          nameVi = item.value;
        }
      });
      for (const config of prodItem.productConfigurations) {
        const configItem = config as VariationOptionDocument;
        configItem.value.forEach((val) => {
          if (val.language === 'en') {
            nameEn += ' ' + val.value;
          } else {
            nameVi += ' ' + val.value;
          }
        });
      }
      productItems.push({
        _id: prodItem._id,
        price: prodItem.price,
        thumbnail: prodItem.thumbnail,
        images: imgUrls,
        name: [
          { language: 'vi', value: nameVi },
          { language: 'en', value: nameEn },
        ],
        configurations: prodItem.productConfigurations.map(
          (config: any) => config._id,
        ),
      });
    }

    return productItems;
  }

  getListVariationOption(product: ProductDocument) {
    const variationOptions: VariationOptionDocument[] = [];
    for (const productItem of product.productItems) {
      const prodItem = productItem as ProductItemDocument;
      variationOptions.push(
        ...(prodItem.productConfigurations as VariationOptionDocument[]),
      );
    }

    const variationList: IVariationList[] = [];
    for (const varia of product.variations) {
      const variation = varia as VariationDocument;
      const variationItemList: IVariationList = {
        _id: variation._id,
        name: variation.name,
        values: [],
      };

      // check if variation option is belong to variation of product
      for (const option of variationOptions) {
        if (option.parentVariation.toString() === variation._id.toString()) {
          const existedOption = variationItemList.values.findIndex(
            (op) => op._id.toString() === option._id.toString(),
          );
          if (existedOption === -1) {
            variationItemList.values.push({
              _id: option._id,
              value: option.value,
            });
          }
        }
      }

      variationList.push(variationItemList);
    }

    return variationList;
  }

  async getProductItemDetail(productId: string, itemId: string) {
    try {
      const product = await this.productModel
        .findById(productId, '-categories')
        .populate({
          path: 'productItems',
          populate: {
            path: 'productConfigurations',
            select: '_id value parentVariation',
          },
          select: '-quantity',
        })
        .populate('brand', 'name')
        .populate('variations', 'name');

      const productItems = await this.extractProducItem(product);

      const variationList = this.getListVariationOption(product);

      return handleResponseSuccess({
        message: GET_PRODUCT_ITEM_DETAIL_SUCCESS,
        data: {
          productItems,
          variationList,
          descriptions: product.description,
        },
      });
    } catch (error) {
      console.log('error: ', error);
      return handleResponseFailure({
        error: error.response?.error || ERROR_GET_PRODUCT_ITEM_DETAIL,
        statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
      });
    }
  }

  async getBrandIdsByCategory(categoryId: string) {
    const ids = await this.categoryService.getListChidrenCategoryIds(
      categoryId,
    );
    const result = await this.productModel.find({
      categories: { $in: ids },
    });

    return result.map((item) => item.brand as string);
  }

  async getBrandIdsBySearchKey(search: string) {
    const result = await this.productModel.find({
      'name.value': { $regex: search, $options: 'i' },
    });

    return result.map((item) => item.brand as string);
  }

  async getProductByCategoryAndOptions(
    categoryId: string,
    { limit, after }: LoadMorePagination,
    { from, to, brands, order }: ProductItemsByCategoryAndOptionsDTO,
  ) {
    try {
      if (after === 'end') {
        return handleResponseSuccess({
          data: {
            productItems: [],
            after: 'end',
          },
          message: GET_PRODUCT_BY_CATEGORY_AND_OPTIONS_SUCCESS,
        });
      }

      const ids = await this.categoryService.getListChidrenCategoryIds(
        categoryId,
      );

      let products = await this.productModel
        .find({
          categories: { $in: ids },
        })
        .populate({
          path: 'productItems',
          populate: [
            {
              path: 'productConfigurations',
              select: '_id value',
            },
            {
              path: 'salesQuantity',
              select: '_id sold',
            },
          ],
          select: '_id price thumbnail productConfigurations rating comments',
        })
        .populate('brand', '_id name')
        .select('_id name categories brand productItems');

      if (brands) {
        products = products.filter((item) =>
          brands.includes((item.brand as BrandDocument)._id.toString()),
        );
      }

      let productItems = await this.convertProductDocumentToProductCard(
        products,
      );

      if (from >= 0 && to >= 0) {
        productItems = productItems.filter(
          (item) => item.price >= from && item.price <= to,
        );
      }

      if (order === 'desc') {
        productItems = productItems.sort((a, b) => b.price - a.price);
      } else if (order === 'asc') {
        productItems = productItems.sort((a, b) => a.price - b.price);
      } else {
        productItems = productItems.sort((a, b) => b.sold - a.sold);
      }

      let index = productItems.findIndex(
        (item) => item.itemId.toString() === after,
      );
      if (index === -1) {
        index = 0;
      }
      const data = productItems.slice(index, limit + index);

      return handleResponseSuccess({
        data: {
          data: data,
          after:
            index + limit >= productItems.length
              ? 'end'
              : productItems[index + limit].itemId,
        },
        message: GET_PRODUCT_BY_CATEGORY_AND_OPTIONS_SUCCESS,
      });
    } catch (error) {
      return handleResponseFailure({
        error: ERROR_GET_PRODUCT_BY_CATEGORY_AND_OPTIONS,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }
  }

  async search(
    query: string,
    { limit, after }: LoadMorePagination,
    { from, to, brands, order }: ProductItemsByCategoryAndOptionsDTO,
  ) {
    try {
      if (after === 'end') {
        return handleResponseSuccess({
          data: {
            productItems: [],
            after: 'end',
          },
          message: GET_PRODUCT_BY_CATEGORY_AND_OPTIONS_SUCCESS,
        });
      }

      let products = await this.productModel
        .find({
          'name.value': { $regex: query, $options: 'i' },
        })
        .populate({
          path: 'productItems',
          populate: [
            {
              path: 'productConfigurations',
              select: '_id value',
            },
            {
              path: 'salesQuantity',
              select: '_id sold',
            },
          ],
          select: '_id price thumbnail productConfigurations rating comments',
        })
        .populate('brand', '_id name')
        .select('_id name categories brand productItems');

      if (brands) {
        products = products.filter((item) =>
          brands.includes((item.brand as BrandDocument)._id.toString()),
        );
      }

      let productItems = await this.convertProductDocumentToProductCard(
        products,
      );

      if (from >= 0 && to >= 0) {
        productItems = productItems.filter(
          (item) => item.price >= from && item.price <= to,
        );
      }

      if (order === 'desc') {
        productItems = productItems.sort((a, b) => b.price - a.price);
      } else if (order === 'asc') {
        productItems = productItems.sort((a, b) => a.price - b.price);
      } else {
        productItems = productItems.sort((a, b) => b.sold - a.sold);
      }

      let index = productItems.findIndex(
        (item) => item.itemId.toString() === after,
      );
      if (index === -1) {
        index = 0;
      }
      const data = productItems.slice(index, limit + index);

      return handleResponseSuccess({
        data: {
          data: data,
          after:
            index + limit >= productItems.length
              ? 'end'
              : productItems[index + limit].itemId,
        },
        message: SEARCH_PRODUCT_SUCCESS,
      });
    } catch (error) {
      return handleResponseFailure({
        error: ERROR_SEARCH_PRODUCT,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }
  }

  async recommendCF(id: string) {
    try {
      const { data } = await this.httpService.axiosRef.get<string[]>(
        `${this.config.get('RECOMMEND_URL')}/product-item/recommend/${id}`,
      );

      const products = await this.productModel
        .find({
          productItems: {
            $elemMatch: {
              $in: data.map((item) => new mongoose.Types.ObjectId(item)),
            },
          },
        })
        .populate({
          path: 'productItems',
          populate: [
            {
              path: 'productConfigurations',
              select: '_id value',
            },
            {
              path: 'salesQuantity',
              select: '_id sold',
            },
          ],
          match: {
            _id: {
              $in: data.map((item) => new mongoose.Types.ObjectId(item)),
            },
          },
          select: '_id price thumbnail productConfigurations rating comments',
        })
        .populate('brand', '_id name')
        .select('_id name categories brand productItems');

      const productItems = await this.convertProductDocumentToProductCard(
        products,
      );

      const recommdedProdItems: ProductCardDTO[] = [];
      for (let i = 0; i < data.length; i++) {
        const prodItemId = data[i];
        const item = productItems.find(
          (prod) => prod.itemId.toString() === prodItemId,
        );
        if (item) {
          recommdedProdItems.push(item);
        }
      }

      return handleResponseSuccess({
        data: recommdedProdItems,
        message: GET_RECOMMEND_CF_SUCCESS,
      });
    } catch (error) {
      return handleResponseFailure({
        error: ERROR_GET_RECOMMEND_CF,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }
  }

  async checkEnoughQuantity(id: string, qty: number) {
    const item = await this.productItemModel.findById(id);

    return item.quantity >= qty ? true : false;
  }

  async subtractQuantity(id: string, qty: number) {
    const item = await this.productItemModel.findById(id);

    item.quantity -= qty;

    await item.save();
  }

  async getProductByProductItemId(id: string) {
    const product = await this.productModel.findOne({ productItems: id });

    return product;
  }

  async getProductItemById(id: string) {
    const item = await this.productItemModel
      .findById(id)
      .populate('productConfigurations')
      .populate('comments');

    return item;
  }

  async addProductItemQuantity(itemId: string, quantity: number) {
    try {
      const item = await this.productItemModel.findById(itemId);
      item.quantity += quantity;
      await item.save();

      return handleResponseSuccess({
        message: ADD_PROD_ITEM_QUANTITY_SUCCESS,
        data: '',
      });
    } catch (error) {
      console.log('error: ', error);
      return handleResponseFailure({
        error: ERROR_ADD_PROD_ITEM_QUANTITY,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }
  }

  async createComment(dto: CreateCommentDTO, userId: string) {
    try {
      const newComment = await this.commentModel.create({
        rate: dto.rate,
        content: dto.content,
        user: userId,
        orderItem: dto.orderItemId,
      });

      const prodItem = await this.productItemModel.findByIdAndUpdate(
        dto.productItemId,
        {
          $push: { comments: newComment._id },
        },
        { new: true },
      );
      // .populate('comments');

      // const newTotalRate = (prodItem.comments as CommentDocument[]).reduce(
      //   (totalRating, currComment) => totalRating + currComment.rate,
      //   0,
      // );

      // prodItem.rating = newTotalRate / prodItem.comments.length;
      prodItem.rating =
        (prodItem.rating * (prodItem.comments.length - 1) + dto.rate) /
        prodItem.comments.length;

      await prodItem.save();

      return handleResponseSuccess({
        message: CREATE_COMMENT_SUCCESS,
        data: {
          _id: newComment._id,
          rate: newComment.rate,
          content: newComment.content,
        },
      });
    } catch (error) {
      console.log('error: ', error);
      return handleResponseFailure({
        error: error.response?.error || ERROR_CREATE_COMMENT,
        statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
      });
    }
  }

  async updateComment(dto: UpdateCommentDTO, commentId: string) {
    try {
      const comment = await this.commentModel.findByIdAndUpdate(
        commentId,
        {
          rate: dto.rate,
          content: dto.content,
        },
        { new: true },
      );

      // re-calculate rating for product item
      const prodItem = await this.productItemModel
        .findById(dto.productItemId, 'rating comments')
        .populate('comments');

      const newTotalRate = (prodItem.comments as CommentDocument[]).reduce(
        (totalRating, currComment) => totalRating + currComment.rate,
        0,
      );

      prodItem.rating = newTotalRate / prodItem.comments.length;

      await prodItem.save();

      return handleResponseSuccess({
        message: UPDATE_COMMENT_SUCCESS,
        data: {
          _id: comment._id,
          rate: comment.rate,
          content: comment.content,
        },
      });
    } catch (error) {
      console.log('error: ', error);
      return handleResponseFailure({
        error: ERROR_UPDATE_COMMENT,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }
  }

  async getRating(prodItemId: string) {
    try {
      const prodItem = await this.productItemModel
        .findById(prodItemId, 'rating comments')
        .populate({
          path: 'comments',
          populate: {
            path: 'user',
            select: 'name',
          },
          select: 'rate',
        });

      const rateType: IRateCount[] = [];
      for (const comment of prodItem.comments as CommentDocument[]) {
        const rateFound = rateType.find((item) => item.rate === comment.rate);
        if (rateFound) {
          rateFound.count++;
        } else {
          rateType.push({
            rate: comment.rate,
            count: 1,
          });
        }
      }

      return handleResponseSuccess({
        message: GET_RATING_AND_COMMENT_SUCCESS,
        data: {
          rating: Math.round(prodItem.rating * 10) / 10,
          rateType,
        },
      });
    } catch (error) {
      console.log('error: ', error);
      return handleResponseFailure({
        error: error.response?.error || ERROR_GET_RATING_AND_COMMENT,
        statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
      });
    }
  }

  async getCommentPagination(prodItemId: string, query: CommentPagination) {
    try {
      const prodItem = await this.productItemModel
        .findById(prodItemId, 'comments')
        .populate({
          path: 'comments',
          populate: {
            path: 'user',
            select: 'name',
          },
          select: 'content user rate createdAt',
        });

      let comments: CommentDocument[] = [];
      if (query.rate) {
        comments = (prodItem.comments as CommentDocument[])
          .reverse()
          .filter((item) => item.rate === query.rate);
      } else {
        comments = (prodItem.comments as CommentDocument[]).reverse();
      }

      const tempTotalPage = Math.floor(comments.length / query.limit);

      return handleResponseSuccess({
        data: {
          data: comments.slice(
            (query.page - 1) * query.limit,
            (query.page - 1) * query.limit + query.limit,
          ),
          totalPage:
            comments.length % query.limit === 0
              ? tempTotalPage
              : tempTotalPage + 1,
        },
        message: GET_COMMENT_PAGINATION_SUCCESS,
      });
    } catch (error) {
      console.log('error: ', error);
      return handleResponseFailure({
        error: error.response?.error || ERROR_GET_COMMENT_PAGINATION,
        statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
      });
    }
  }

  async checkTagIsUsedByProductItem(tagId: string) {
    const productItem = await this.productItemModel.findOne({
      tags: new mongoose.Types.ObjectId(tagId),
    });
    if (productItem) {
      return true;
    }

    return false;
  }

  // async ramdomProdutItem() {
  //   const productItems = await this.productItemModel.find();

  //   const random = shuffle(productItems);

  //   return random
  //     .slice(0, 20)
  //     .map((item) => ({ id: item._id, price: item.price }));
  // }

  async recommendItemBased(user: string) {
    try {
      const { data } = await this.httpService.axiosRef.get<string[]>(
        `${this.config.get(
          'RECOMMEND_URL',
        )}/product-item/recommend-item-based/${user}`,
      );

      const products = await this.productModel
        .find({
          productItems: {
            $elemMatch: {
              $in: data.map((item) => new mongoose.Types.ObjectId(item)),
            },
          },
        })
        .populate({
          path: 'productItems',
          populate: [
            {
              path: 'productConfigurations',
              select: '_id value',
            },
            {
              path: 'salesQuantity',
              select: '_id sold',
            },
          ],
          match: {
            _id: {
              $in: data.map((item) => new mongoose.Types.ObjectId(item)),
            },
          },
          select: '_id price thumbnail productConfigurations rating comments',
        })
        .populate('brand', '_id name')
        .select('_id name categories brand productItems');

      const productItems = await this.convertProductDocumentToProductCard(
        products,
      );

      const recommdedProdItems: ProductCardDTO[] = [];
      for (let i = 0; i < data.length; i++) {
        const prodItemId = data[i];
        const item = productItems.find(
          (prod) => prod.itemId.toString() === prodItemId,
        );
        if (item) {
          recommdedProdItems.push(item);
        }
      }

      return handleResponseSuccess({
        data: recommdedProdItems,
        message: GET_RECOMMEND_ITEM_BASED_SUCCESS,
      });
    } catch (error) {
      console.log('error: ', error);
      return handleResponseFailure({
        error: error.response?.error || ERROR_GET_RECOMMEND_ITEM_BASED,
        statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
      });
    }
  }

  async getProdBrandByProdItemId(id: string) {
    const product = await this.productModel.findOne(
      { productItems: id },
      'brand',
    );

    return product.brand;
  }

  async getProductByBrandAndOptions(
    brandId: string,
    { limit, after }: LoadMorePagination,
    { from, to, order }: ProductItemsByBrandAndOptionsDTO,
  ) {
    try {
      if (after === 'end') {
        return handleResponseSuccess({
          data: {
            productItems: [],
            after: 'end',
          },
          message: GET_PRODUCT_BY_CATEGORY_AND_OPTIONS_SUCCESS,
        });
      }

      const products = await this.productModel
        .find({
          brand: new mongoose.Types.ObjectId(brandId),
        })
        .populate({
          path: 'productItems',
          populate: [
            {
              path: 'productConfigurations',
              select: '_id value',
            },
            {
              path: 'salesQuantity',
              select: '_id sold',
            },
          ],
          select: '_id price thumbnail productConfigurations rating comments',
        })
        .populate('brand', '_id name')
        .select('_id name brand productItems');

      let productItems = await this.convertProductDocumentToProductCard(
        products,
      );

      if (from >= 0 && to >= 0) {
        productItems = productItems.filter(
          (item) => item.price >= from && item.price <= to,
        );
      }

      if (order === 'desc') {
        productItems = productItems.sort((a, b) => b.price - a.price);
      } else if (order === 'asc') {
        productItems = productItems.sort((a, b) => a.price - b.price);
      } else {
        productItems = productItems.sort((a, b) => b.sold - a.sold);
      }

      let index = productItems.findIndex(
        (item) => item.itemId.toString() === after,
      );
      if (index === -1) {
        index = 0;
      }
      const data = productItems.slice(index, limit + index);

      return handleResponseSuccess({
        data: {
          data: data,
          after:
            index + limit >= productItems.length
              ? 'end'
              : productItems[index + limit].itemId,
        },
        message: GET_PRODUCT_BY_CATEGORY_AND_OPTIONS_SUCCESS,
      });
    } catch (error) {
      return handleResponseFailure({
        error: ERROR_GET_PRODUCT_BY_CATEGORY_AND_OPTIONS,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }
  }

  async getCategoryIdByProductId(productId: string) {
    try {
      const product = await this.productModel.findById(productId);
      return handleResponseSuccess({
        data: product.categories[0],
        message: GET_CATEGORY_ID_OF_PRODUCT_SUCCESS,
      });
    } catch (error) {
      return handleResponseFailure({
        error: ERROR_GET_CATEGORY_ID_OF_PRODUCT,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }
  }

  // async addSalesQuantityToProductItem(
  //   productItemId: string,
  //   salesQuantityId: string,
  // ) {
  //   await this.productItemModel.findOneAndUpdate(
  //     { _id: productItemId },
  //     { salesQuantity: salesQuantityId },
  //   );
  // }

  async amountOfSoldItemsInBrands() {
    const result = (await this.productModel.aggregate([
      {
        $unwind: '$productItems',
      },
      {
        $lookup: {
          from: 'productitems',
          localField: 'productItems',
          foreignField: '_id',
          as: 'productItems',
          pipeline: [
            {
              $lookup: {
                from: 'salesquantities',
                localField: 'salesQuantity',
                foreignField: '_id',
                as: 'salesQuantity',
              },
            },
            {
              $unwind: '$salesQuantity',
            },
          ],
        },
      },
      {
        $unwind: '$productItems',
      },
      {
        $group: {
          _id: '$brand',
          soldItems: {
            $sum: '$productItems.salesQuantity.sold',
          },
        },
      },
      {
        $sort: {
          soldItems: -1,
        },
      },
      {
        $limit: 15,
      },
    ])) as { _id: string; soldItems: number }[];

    return result.map((item) => item._id);
  }

  async getSalesQuantityByProductId(id: string) {
    const productItem = await this.productItemModel.findById(id);
    return productItem.salesQuantity;
  }
}

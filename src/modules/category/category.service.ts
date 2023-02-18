import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  CREATE_CATEGORY_SUCCESS,
  ERROR_CATEGORY_EXISTED,
  ERROR_CREATE_CATEGORY,
  ERROR_GET_CATEGORY_LEAF,
  GET_CATEGORY_LEAF_SUCCESS,
} from '../../constances';
import { CreateCategory } from '../../dto/request';
import { CategoryLeafDTO } from '../../dto/response';
import { Category, CategoryDocument } from '../../schemas';
import {
  handleResponseFailure,
  handleResponseSuccess,
} from '../../utils/handle-response';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  async create(body: CreateCategory) {
    try {
      const existedCate = await this.categoryModel.findOne({ name: body.name });
      if (existedCate) {
        return handleResponseFailure({
          error: ERROR_CATEGORY_EXISTED,
          statusCode: HttpStatus.CONFLICT,
        });
      }

      const newCategory = await this.categoryModel.create({
        parentCategory: body.parentCategory,
        name: body.name,
      });

      return handleResponseSuccess({
        message: CREATE_CATEGORY_SUCCESS,
        data: newCategory,
      });
    } catch (error) {
      console.log('error: ', error);
      return handleResponseFailure({
        error: error.response?.error || ERROR_CREATE_CATEGORY,
        statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
      });
    }
  }

  async getLeaf() {
    try {
      const categories = await this.categoryModel.find({
        parentCategory: { $ne: null },
      });

      const parentsId = [];

      for (const category of categories) {
        parentsId.push(category.parentCategory);
      }

      const categoriesLeaf = (await this.categoryModel.find(
        {
          _id: { $nin: parentsId },
        },
        { _id: 1, name: 1 },
      )) as CategoryLeafDTO[];

      return handleResponseSuccess({
        data: categoriesLeaf,
        message: GET_CATEGORY_LEAF_SUCCESS,
      });
    } catch (error) {
      return handleResponseFailure({
        error: ERROR_GET_CATEGORY_LEAF,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }
  }
}

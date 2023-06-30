import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import {
  CREATE_CATEGORY_SUCCESS,
  DELETE_CATEGORY_SUCCESS,
  ERROR_CATEGORY_EXISTED,
  ERROR_CREATE_CATEGORY,
  ERROR_DELETE_CATEGORY,
  ERROR_GET_CATEGORIES,
  ERROR_GET_CATEGORY_LEAF,
  GET_CATEGORIES_SUCCESS,
  GET_CATEGORY_LEAF_SUCCESS,
} from '../../constances';
import { CreateCategory } from '../../dto/request';
import { CategoryLeafDTO, CategoryResDTO } from '../../dto/response';
import { Category, CategoryDocument } from '../../schemas';
import {
  handleResponseFailure,
  handleResponseSuccess,
} from '../../utils/handle-response';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectMapper() private readonly mapper: Mapper,
    private readonly cloudinaryService: CloudinaryService,
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

  async getParentCategory() {
    const categories = await this.categoryModel.find({
      parentCategory: null,
    });

    for (const category of categories) {
      category.icon = await this.cloudinaryService.getImageUrl(category.icon);
    }

    return this.mapper.mapArray(categories, Category, CategoryResDTO);
  }

  async getChildrenCategory(parentId: string) {
    const categories = await this.categoryModel.find({
      parentCategory: parentId,
    });

    return this.mapper.mapArray(categories, Category, CategoryResDTO);
  }

  async get() {
    try {
      const parents = await this.getParentCategory();
      for (const parent of parents) {
        const children = await this.getChildrenCategory(parent._id);
        if (children.length > 0) {
          parent.children = children;

          for (const child of parent.children) {
            const grandChildren = await this.getChildrenCategory(child._id);

            if (grandChildren.length > 0) {
              child.children = grandChildren;
            }
          }
        }
      }

      return handleResponseSuccess({
        data: parents,
        message: GET_CATEGORIES_SUCCESS,
      });
    } catch (error) {
      return handleResponseFailure({
        error: ERROR_GET_CATEGORIES,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }
  }

  async getListChidrenCategoryIds(parentId: string) {
    const result: string[] = [];

    const children = await this.getChildrenCategory(parentId);
    if (children.length <= 0) {
      return [parentId];
    }

    for (const child of children) {
      const grandChildren = await this.getChildrenCategory(child._id);
      if (grandChildren.length > 0) {
        for (const grandChild of grandChildren) {
          result.push(grandChild._id);
        }
      } else {
        result.push(child._id);
      }
    }

    return result;
  }

  async getCategoryIdByName(categoryName: string) {
    console.log('categoryName: ', categoryName);
    const category = await this.categoryModel.findOne({
      'name.value': { $regex: categoryName, $options: 'i' },
    });
    return category.id ? category.id : '';
  }

  async deletCategory(id: string) {
    try {
      const category = await this.categoryModel.findById(id);

      if (category.icon) {
        this.cloudinaryService.deleteImage(category.icon);
      }

      const children = await this.getListChidrenCategoryIds(id);

      if (children.length > 0) {
        for (const childId of children) {
          await this.categoryModel.findByIdAndDelete(childId);
        }
      }

      return handleResponseSuccess({
        message: DELETE_CATEGORY_SUCCESS,
        data: id,
      });
    } catch (error) {
      return handleResponseFailure({
        error: ERROR_DELETE_CATEGORY,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }
  }
}

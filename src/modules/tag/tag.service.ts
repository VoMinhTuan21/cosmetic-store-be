import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import {
  CREATE_TAG_GROUP_SUCCESS,
  CREATE_TAG_SUCCESS,
  DELETE_TAG_GROUP_SUCCESS,
  DELETE_TAG_SUCCESS,
  ERROR_CREATE_TAG,
  ERROR_CREATE_TAG_GROUP,
  ERROR_DELETE_TAG,
  ERROR_DELETE_TAG_GROUP,
  ERROR_GET_TAGS,
  ERROR_TAG_EXISTED,
  ERROR_TAG_GROUP_EXISTED,
  ERROR_TAG_GROUP_NOT_EXIST,
  ERROR_TAG_IS_BEING_USED_BY_PRODUCT_ITEM,
  ERROR_TAG_NOT_FOUND,
  ERROR_UPDATE_ADDRESS,
  ERROR_UPDATE_TAG_GROUP,
  GET_TAGS_SUCCESS,
  UPDATE_TAG_GROUP_SUCCESS,
  UPDATE_TAG_SUCCESS,
} from '../../constances';
import {
  CreateTagDTO,
  CreateTagGroupDTO as CreateTagGroupDTO,
  UpdateTagDTO,
} from '../../dto/request';
import {
  TagGroupResDTO,
  TagGroupTableResDTO,
  TagResDTO,
  TagTableResDTO,
} from '../../dto/response';
import { Tag, TagDocument } from '../../schemas/tag.schema';
import { TagGroup, TagGroupDocument } from '../../schemas/tagGroup.schema';
import {
  handleResponseFailure,
  handleResponseSuccess,
} from '../../utils/handle-response';
import { ProductService } from '../product/product.service';

@Injectable()
export class TagService {
  constructor(
    @InjectModel(Tag.name)
    private readonly tagModel: Model<TagDocument>,
    @InjectModel(TagGroup.name)
    private readonly tagGroupModel: Model<TagGroupDocument>,
    @InjectMapper() private readonly mapper: Mapper,
    private readonly productService: ProductService,
  ) {}

  async createTag(dto: CreateTagDTO) {
    try {
      const tagGroup = await this.tagGroupModel.findById(dto.parent);
      if (!tagGroup) {
        return handleResponseFailure({
          error: ERROR_TAG_GROUP_NOT_EXIST,
          statusCode: HttpStatus.NOT_FOUND,
        });
      }

      const tag = await this.tagModel.findOne({ name: dto.name });

      if (tag && tag.parent.toString() !== dto.parent) {
        return handleResponseFailure({
          error: ERROR_TAG_EXISTED,
          statusCode: HttpStatus.CONFLICT,
        });
      }

      const newTag = await this.tagModel.create({
        name: dto.name,
        weight: dto.weight,
        parent: dto.parent,
      });

      return handleResponseSuccess({
        data: this.mapper.map(newTag, Tag, TagResDTO),
        message: CREATE_TAG_SUCCESS,
      });
    } catch (error) {
      return handleResponseFailure({
        error: error.response?.error || ERROR_CREATE_TAG,
        statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
      });
    }
  }

  async createTagGroup(dto: CreateTagGroupDTO) {
    try {
      const tagGroup = await this.tagGroupModel.findOne({
        name: dto.name,
      });

      if (tagGroup) {
        return handleResponseFailure({
          error: ERROR_TAG_GROUP_EXISTED,
          statusCode: HttpStatus.CONFLICT,
        });
      }

      const newTagGroup = await this.tagGroupModel.create({
        name: dto.name,
      });

      return handleResponseSuccess({
        data: this.mapper.map(newTagGroup, TagGroup, TagGroupResDTO),
        message: CREATE_TAG_GROUP_SUCCESS,
      });
    } catch (error) {
      return handleResponseFailure({
        error: error.response?.error || ERROR_CREATE_TAG_GROUP,
        statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
      });
    }
  }

  async update(dto: UpdateTagDTO) {
    try {
      const tag = await this.tagModel.findById(dto.id);

      if (!tag) {
        return handleResponseFailure({
          error: ERROR_TAG_NOT_FOUND,
          statusCode: HttpStatus.NOT_FOUND,
        });
      }

      tag.name = dto.name;
      tag.weight = dto.weight;
      await tag.save();

      return handleResponseSuccess({
        data: this.mapper.map(tag, Tag, TagResDTO),
        message: UPDATE_TAG_SUCCESS,
      });
    } catch (error) {
      return handleResponseFailure({
        error: error.response?.error || ERROR_UPDATE_ADDRESS,
        statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
      });
    }
  }

  async delete(id: string) {
    try {
      const isUsed = await this.productService.checkTagIsUsedByProductItem(id);

      if (isUsed) {
        return handleResponseFailure({
          error: ERROR_TAG_IS_BEING_USED_BY_PRODUCT_ITEM,
          statusCode: HttpStatus.NOT_ACCEPTABLE,
        });
      }

      const tag = await this.tagModel.findById(id);

      if (!tag) {
        return handleResponseFailure({
          error: ERROR_TAG_NOT_FOUND,
          statusCode: HttpStatus.NOT_FOUND,
        });
      }

      await this.tagModel.findByIdAndDelete(id);

      return handleResponseSuccess({
        data: {
          _id: id,
          parent: tag.parent,
        },
        message: DELETE_TAG_SUCCESS,
      });
    } catch (error) {
      return handleResponseFailure({
        error: error.response?.error || ERROR_DELETE_TAG,
        statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
      });
    }
  }

  async get() {
    try {
      const tags = await this.tagModel.find({});
      return handleResponseSuccess({
        data: this.mapper.mapArray(tags, Tag, TagResDTO),
        message: GET_TAGS_SUCCESS,
      });
    } catch (error) {
      return handleResponseFailure({
        error: ERROR_GET_TAGS,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }
  }

  async getTagsTable() {
    try {
      const tagGroups = await this.tagGroupModel.find({});
      const result: TagGroupTableResDTO[] = [];

      for (const group of tagGroups) {
        const childern = await this.tagModel.find({ parent: group._id });

        result.push({
          _id: group._id,
          name: group.name,
          children: this.mapper.mapArray(childern, Tag, TagTableResDTO),
        });
      }

      return handleResponseSuccess({
        data: result,
        message: GET_TAGS_SUCCESS,
      });
    } catch (error) {
      return handleResponseFailure({
        error: ERROR_GET_TAGS,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }
  }

  async deleteTagGroup(id: string) {
    try {
      const tagGroup = await this.tagGroupModel.findById(id);

      if (!tagGroup) {
        return handleResponseFailure({
          error: ERROR_TAG_GROUP_NOT_EXIST,
          statusCode: HttpStatus.NOT_FOUND,
        });
      }

      const tags = await this.tagModel.find({
        parent: new mongoose.Types.ObjectId(id),
      });

      for (const tag of tags) {
        const isUsed = await this.productService.checkTagIsUsedByProductItem(
          tag._id.toString(),
        );

        if (isUsed) {
          return handleResponseFailure({
            error: `TAG_${tag._id}_IS_BEING_USED_BY_PRODUCT_ITEM`,
            statusCode: HttpStatus.NOT_ACCEPTABLE,
          });
        }
      }

      for (const tag of tags) {
        await this.delete(tag._id.toString());
      }

      await tagGroup.delete();

      return handleResponseSuccess({
        data: id,
        message: DELETE_TAG_GROUP_SUCCESS,
      });
    } catch (error) {
      return handleResponseFailure({
        error: error.response?.error || ERROR_DELETE_TAG_GROUP,
        statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
      });
    }
  }

  async updateTagGroup(tagGroupId: string, name: string) {
    try {
      const tagGroup = await this.tagGroupModel.findByIdAndUpdate(
        tagGroupId,
        {
          name: name,
        },
        { new: true },
      );
      return handleResponseSuccess({
        message: UPDATE_TAG_GROUP_SUCCESS,
        data: this.mapper.map(tagGroup, TagGroup, TagGroupResDTO),
      });
    } catch (error) {
      console.log('error: ', error);
      return handleResponseFailure({
        error: ERROR_UPDATE_TAG_GROUP,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }
  }
}

import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  CREATE_TAG_SUCCESS,
  DELETE_TAG_SUCCESS,
  ERROR_CREATE_TAG,
  ERROR_DELETE_TAG,
  ERROR_GET_TAGS,
  ERROR_TAG_EXISTED,
  ERROR_TAG_NOT_FOUND,
  ERROR_UPDATE_ADDRESS,
  GET_TAGS_SUCCESS,
  UPDATE_TAG_SUCCESS,
} from '../../constances';
import { CreateTagDTO, UpdateTagDTO } from '../../dto/request';
import { TagResDTO } from '../../dto/response';
import { Tag, TagDocument } from '../../schemas/tag.schema';
import {
  handleResponseFailure,
  handleResponseSuccess,
} from '../../utils/handle-response';

@Injectable()
export class TagService {
  constructor(
    @InjectModel(Tag.name)
    private readonly tagModel: Model<TagDocument>,
    @InjectMapper() private readonly mapper: Mapper,
  ) {}

  async create(dto: CreateTagDTO) {
    try {
      const tag = await this.tagModel.findOne({ name: dto.name });

      if (tag) {
        return handleResponseFailure({
          error: ERROR_TAG_EXISTED,
          statusCode: HttpStatus.CONFLICT,
        });
      }

      const newTag = await this.tagModel.create({
        name: dto.name,
        weight: dto.weight,
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
      await this.tagModel.findByIdAndDelete(id);

      return handleResponseSuccess({
        data: id,
        message: DELETE_TAG_SUCCESS,
      });
    } catch (error) {
      return handleResponseFailure({
        error: ERROR_DELETE_TAG,
        statusCode: HttpStatus.BAD_REQUEST,
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
}

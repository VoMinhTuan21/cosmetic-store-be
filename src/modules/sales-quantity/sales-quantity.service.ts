import { HttpStatus, Injectable } from '@nestjs/common';
import mongoose, { Model } from 'mongoose';
import {
  SalesQuantity,
  SalesQuantityDocument,
} from '../../schemas/salesQuantity.schema';
import { InjectModel } from '@nestjs/mongoose';
import { CreateSalesQuantityDTO } from '../../dto/request';
import { handleResponseFailure } from '../../utils/handle-response';
import { ERROR_CREATE_SALES_QUANTITY } from '../../constances';

@Injectable()
export class SalesQuantityService {
  constructor(
    @InjectModel(SalesQuantity.name)
    private readonly salesQuantityModel: Model<SalesQuantityDocument>,
  ) {}

  async create(dto: CreateSalesQuantityDTO) {
    try {
      const newSalesQuantity = await this.salesQuantityModel.create({
        sold: dto.sold,
      });

      return newSalesQuantity._id;
    } catch (error) {
      handleResponseFailure({
        error: ERROR_CREATE_SALES_QUANTITY,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }
  }

  async update(id: string, sold: number, type: 'add' | 'subtract' = 'add') {
    const salesQuantity = await this.salesQuantityModel.findById(id);
    if (type === 'add') {
      salesQuantity.sold += sold;
    } else {
      salesQuantity.sold -= sold;
    }

    await salesQuantity.save();
  }
}

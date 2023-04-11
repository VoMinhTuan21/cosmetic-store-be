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
      const salesQuantity = await this.salesQuantityModel.findOne({
        productItem: new mongoose.Types.ObjectId(dto.productItem),
      });

      if (salesQuantity) {
        salesQuantity.sold += dto.sold;
        await salesQuantity.save();
      } else {
        await this.salesQuantityModel.create({
          productItem: dto.productItem,
          sold: dto.sold,
        });
      }

      return 'success';
    } catch (error) {
      handleResponseFailure({
        error: ERROR_CREATE_SALES_QUANTITY,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }
  }

  async getSalesQuantities(limit: number, after?: string) {
    const salesQuantities = await this.salesQuantityModel
      .find()
      .sort({ sold: -1 });

    if (after) {
      const index = salesQuantities.findIndex(
        (item) => item.productItem.toString() === after,
      );
    }
  }
}

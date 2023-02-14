import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Brand, BrandDocument } from '../../schemas';

@Injectable()
export class BrandService {
  constructor(
    @InjectModel(Brand.name) private categoryModel: Model<BrandDocument>,
  ) {}

  async create(name: string, logo: Express.Multer.File) {}
}

import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Product,
  ProductDocument,
  ProductItem,
  ProductItemDocument,
} from '../../schemas';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(ProductItem.name)
    private readonly productItemModel: Model<ProductItemDocument>,
  ) {}
}

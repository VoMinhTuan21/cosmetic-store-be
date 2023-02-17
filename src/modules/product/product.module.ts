import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Product,
  ProductItem,
  ProductItemSchema,
  ProductSchema,
} from '../../schemas';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: ProductItem.name, schema: ProductItemSchema },
    ]),
    CloudinaryModule,
  ],
  providers: [ProductService],
  controllers: [ProductController],
})
export class ProductModule {}

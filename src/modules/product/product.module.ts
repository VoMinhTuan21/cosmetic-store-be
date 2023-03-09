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
import { ProductProfile } from './product.profile';
import { CategoryModule } from '../category/category.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: ProductItem.name, schema: ProductItemSchema },
    ]),
    CloudinaryModule,
    CategoryModule,
    HttpModule,
  ],
  providers: [ProductService, ProductProfile],
  controllers: [ProductController],
  exports: [ProductService],
})
export class ProductModule {}

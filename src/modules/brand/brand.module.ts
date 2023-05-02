import { Module } from '@nestjs/common';
import { BrandService } from './brand.service';
import { BrandController } from './brand.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Brand, BrandSchema } from '../../schemas';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { BrandProfile } from './brand.profile';
import { ProductModule } from '../product/product.module';
import { OrderModule } from '../order/order.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Brand.name, schema: BrandSchema }]),
    CloudinaryModule,
    ProductModule,
    OrderModule,
  ],
  providers: [BrandService, BrandProfile],
  controllers: [BrandController],
  exports: [BrandService],
})
export class BrandModule {}

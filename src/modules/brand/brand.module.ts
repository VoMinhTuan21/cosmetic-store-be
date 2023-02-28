import { Module } from '@nestjs/common';
import { BrandService } from './brand.service';
import { BrandController } from './brand.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Brand, BrandSchema } from '../../schemas';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { BrandProfile } from './brand.profile';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Brand.name, schema: BrandSchema }]),
    CloudinaryModule,
  ],
  providers: [BrandService, BrandProfile],
  controllers: [BrandController],
})
export class BrandModule {}

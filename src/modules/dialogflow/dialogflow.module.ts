import { Module } from '@nestjs/common';
import { DialogflowService } from './dialogflow.service';
import { DialogflowController } from './dialogflow.controller';
import { FacebookService } from './facebook.service';
import { HttpModule } from '@nestjs/axios';
import { TagModule } from '../tag/tag.module';
import { ProductModule } from '../product/product.module';
import { BrandModule } from '../brand/brand.module';

@Module({
  imports: [HttpModule, TagModule, ProductModule, BrandModule],
  providers: [DialogflowService, FacebookService],
  controllers: [DialogflowController],
  exports: [FacebookService],
})
export class DialogflowModule {}

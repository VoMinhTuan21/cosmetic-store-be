import { Module } from '@nestjs/common';
import { TagService } from './tag.service';
import { TagController } from './tag.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Tag, TagSchema } from '../../schemas/tag.schema';
import { TagProfile } from './tag.profile';
import { TagGroup, TagGroupSchema } from '../../schemas/tagGroup.schema';
import { ProductModule } from '../product/product.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Tag.name, schema: TagSchema },
      { name: TagGroup.name, schema: TagGroupSchema },
    ]),
    ProductModule,
  ],
  providers: [TagService, TagProfile],
  controllers: [TagController],
  exports: [TagService],
})
export class TagModule {}

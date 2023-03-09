import { Module } from '@nestjs/common';
import { TagService } from './tag.service';
import { TagController } from './tag.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Tag, TagSchema } from '../../schemas/tag.schema';
import { TagProfile } from './tag.profile';

@Module({
  imports: [MongooseModule.forFeature([{ name: Tag.name, schema: TagSchema }])],
  providers: [TagService, TagProfile],
  controllers: [TagController],
})
export class TagModule {}

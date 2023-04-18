import { Module } from '@nestjs/common';
import { SettingService } from './setting.service';
import { SettingController } from './setting.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Setting, SettingSchema } from '../../schemas/setting.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Setting.name, schema: SettingSchema }]),
  ],
  providers: [SettingService],
  controllers: [SettingController],
})
export class SettingModule {}

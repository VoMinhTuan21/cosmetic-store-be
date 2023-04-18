import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import * as Joi from 'joi';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './modules/user/user.module';
import { classes } from '@automapper/classes';
import { AutomapperModule } from '@automapper/nestjs';
import { MailModule } from './modules/mail/mail.module';
import { OtpverificationModule } from './modules/otpverification/otpverification.module';
import { VariationModule } from './modules/variation/variation.module';
import { CategoryModule } from './modules/category/category.module';
import { CloudinaryModule } from './modules/cloudinary/cloudinary.module';
import { BrandModule } from './modules/brand/brand.module';
import { ProductModule } from './modules/product/product.module';
import { TagModule } from './modules/tag/tag.module';
import { OrderModule } from './modules/order/order.module';
import { AdminModule } from './modules/admin/admin.module';
import { SalesQuantityModule } from './modules/sales-quantity/sales-quantity.module';
import { SettingModule } from './modules/setting/setting.module';

@Module({
  imports: [
    AutomapperModule.forRoot({
      strategyInitializer: classes(),
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `env/.env.${process.env.NODE_ENV || 'local'}`,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('local', 'development', 'production')
          .default('local'),
      }),
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (cfg: ConfigService) => ({
        uri: cfg.get('MONGODB_URI'),
        useNewUrlParser: true,
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UserModule,
    MailModule,
    OtpverificationModule,
    VariationModule,
    CategoryModule,
    CloudinaryModule,
    BrandModule,
    ProductModule,
    TagModule,
    OrderModule,
    AdminModule,
    SalesQuantityModule,
    SettingModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

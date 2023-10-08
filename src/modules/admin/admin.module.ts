import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { Admin, AdminSchema } from '../../schemas';
import { MongooseModule } from '@nestjs/mongoose';
import { MailModule } from '../mail/mail.module';
import { OtpverificationModule } from '../otpverification/otpverification.module';
import { AuthModule } from '../auth/auth.module';
import { AdminProfile } from './admin.profile';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Admin.name, schema: AdminSchema }]),
    MailModule,
    OtpverificationModule,
    AuthModule,
  ],
  providers: [AdminService, AdminProfile],
  controllers: [AdminController],
})
export class AdminModule {}

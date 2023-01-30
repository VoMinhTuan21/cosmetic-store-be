import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OTPVerification, OTPVerificationSchema } from '../../schemas';
import { OtpverificationService } from './otpverification.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: OTPVerification.name, schema: OTPVerificationSchema },
    ]),
  ],
  providers: [OtpverificationService],
  exports: [OtpverificationService],
})
export class OtpverificationModule {}

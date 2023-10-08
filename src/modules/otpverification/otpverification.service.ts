import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ERROR_CREATE_OTP,
  ERROR_OTP_INCORRECT,
  ERROR_VERIFY_OTP,
} from '../../constances';
import { OTPVerification, OTPVerificationDocument } from '../../schemas';
import { handleResponseFailure } from '../../utils/handle-response';

@Injectable()
export class OtpverificationService {
  constructor(
    @InjectModel(OTPVerification.name)
    private otpModel: Model<OTPVerificationDocument>,
  ) {}

  async create(email: string, otp: string) {
    try {
      await this.otpModel.create({
        email,
        otp,
      });
    } catch (error) {
      console.log('error: ', error);
      return handleResponseFailure({
        error: error.response?.error || ERROR_CREATE_OTP,
        statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
      });
    }
  }

  async verifyOTP(email: string, otp: string) {
    try {
      const existedOtp = await this.otpModel.findOne({
        email: email,
        otp: otp,
      });
      if (!existedOtp) {
        return handleResponseFailure({
          error: ERROR_OTP_INCORRECT,
          statusCode: HttpStatus.BAD_REQUEST,
        });
      }

      await this.otpModel.deleteOne({ email: email, otp: otp });
    } catch (error) {
      console.log('error: ', error);
      return handleResponseFailure({
        error: error.response?.error || ERROR_VERIFY_OTP,
        statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
      });
    }
  }
}

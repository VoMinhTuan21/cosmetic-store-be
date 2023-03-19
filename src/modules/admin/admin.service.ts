import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  CHANGE_PASS_SUCCESS,
  CREATE_ADMIN_SUCCESS,
  ERROR_CHANGE_PASS,
  ERROR_CREATE_ADDRESS,
  ERROR_EMAIL_HAS_BEEN_USED,
  ERROR_GET_ADMIN_INFO,
  ERROR_PASSWORD_NOT_MATCH,
  ERROR_SIGN_IN_ADMIN,
  ERROR_UPDATE_ADMIN,
  ERROR_USER_NOT_EXIST,
  GET_ADMIN_INFO_SUCCESS,
  SIGN_IN_ADMIN_SUCCESS,
  UPDATE_ADMIN_SUCCESS,
} from '../../constances';
import { AdminRole, Role } from '../../constances/enum';
import {
  ChangePassDTO,
  CreateAdminDTO,
  SignInAdminDTO,
  UpdateAdminDTO,
} from '../../dto/request';
import { AdminResDTO } from '../../dto/response';
import { Admin, AdminDocument } from '../../schemas';
import {
  handleResponseFailure,
  handleResponseSuccess,
} from '../../utils/handle-response';
import { comparePassword, hashPasswords } from '../../utils/hash-password';
import { AuthService } from '../auth/auth.service';
import { OtpverificationService } from '../otpverification/otpverification.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Admin.name) private readonly adminModel: Model<AdminDocument>,
    private readonly otpVerificationService: OtpverificationService,
    private readonly authService: AuthService,
    @InjectMapper() private readonly mapper: Mapper,
  ) {}

  async createAdmin(dto: CreateAdminDTO) {
    try {
      const admin = await this.adminModel.findOne({ email: dto.email });
      if (admin) {
        return handleResponseFailure({
          error: ERROR_EMAIL_HAS_BEEN_USED,
          statusCode: HttpStatus.CONFLICT,
        });
      }

      await this.otpVerificationService.verifyOTP(dto.email, dto.code);

      const hash = hashPasswords(dto.password);

      const newAdmin = await this.adminModel.create({
        email: dto.email,
        name: dto.name,
        birthday: dto.birthday,
        gender: dto.gender,
        role: AdminRole.Main,
        password: hash,
      });

      return handleResponseSuccess({
        data: CREATE_ADMIN_SUCCESS,
        message: CREATE_ADMIN_SUCCESS,
      });
    } catch (error) {
      return handleResponseFailure({
        error: error.response?.error || ERROR_CREATE_ADDRESS,
        statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
      });
    }
  }

  async signIn(dto: SignInAdminDTO) {
    try {
      const admin = await this.adminModel.findOne({ email: dto.email });

      if (!admin) {
        return handleResponseFailure({
          error: ERROR_USER_NOT_EXIST,
          statusCode: HttpStatus.NOT_FOUND,
        });
      }

      const matchPass = await comparePassword(dto.password, admin.password);

      if (matchPass) {
        const token = await this.authService.signJWTToken(
          admin._id,
          admin.email,
          admin.name,
          false,
          [Role.Admin],
        );

        return handleResponseSuccess({
          data: {
            token: token,
            user: this.mapper.map(admin, Admin, AdminResDTO),
          },
          message: SIGN_IN_ADMIN_SUCCESS,
        });
      } else {
        return handleResponseFailure({
          error: ERROR_PASSWORD_NOT_MATCH,
          statusCode: HttpStatus.NOT_ACCEPTABLE,
        });
      }
    } catch (error) {
      return handleResponseFailure({
        error: error.response?.error || ERROR_SIGN_IN_ADMIN,
        statusCode: error.response?.statusCode || HttpStatus.BAD_REQUEST,
      });
    }
  }

  async getuserInfo(id: string) {
    try {
      const user = await this.adminModel.findById(id);

      return handleResponseSuccess({
        data: this.mapper.map(user, Admin, AdminResDTO),
        message: GET_ADMIN_INFO_SUCCESS,
      });
    } catch (error) {
      return handleResponseFailure({
        error: ERROR_GET_ADMIN_INFO,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }
  }

  async updateInfo(id: string, dto: UpdateAdminDTO) {
    try {
      const admin = await this.adminModel.findById(id);

      admin.name = dto.name;
      admin.birthday = dto.birthday;
      admin.gender = dto.gender;

      await admin.save();

      return handleResponseSuccess({
        data: this.mapper.map(admin, Admin, AdminResDTO),
        message: UPDATE_ADMIN_SUCCESS,
      });
    } catch (error) {
      return handleResponseFailure({
        error: ERROR_UPDATE_ADMIN,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }
  }

  async changePass(id: string, dto: ChangePassDTO) {
    try {
      const admin = await this.adminModel.findById(id);

      const matchPass = await comparePassword(dto.oldPass, admin.password);

      if (!matchPass) {
        return handleResponseFailure({
          error: ERROR_PASSWORD_NOT_MATCH,
          statusCode: HttpStatus.CONFLICT,
        });
      }

      admin.password = hashPasswords(dto.newPass);
      await admin.save();

      return handleResponseSuccess({
        data: CHANGE_PASS_SUCCESS,
        message: CHANGE_PASS_SUCCESS,
      });
    } catch (error) {
      return handleResponseFailure({
        error: error.response?.error || ERROR_CHANGE_PASS,
        statusCode: error.response.statusCode || HttpStatus.BAD_REQUEST,
      });
    }
  }
}

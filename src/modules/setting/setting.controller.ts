import { Body, Controller, Get, Post, Put } from '@nestjs/common';
import { SettingService } from './setting.service';
import { ApiTags } from '@nestjs/swagger';
import { UpdateShippingFeePeerKmDTO } from '../../dto/request';

@ApiTags('Setting')
@Controller('setting')
export class SettingController {
  constructor(private readonly settingService: SettingService) {}

  @Post()
  createSetting() {
    return this.settingService.create();
  }

  @Get('/shipping-fee-per-km')
  getShippingFeePerKm() {
    return this.settingService.getShippingFeePerKm();
  }

  @Put('/shipping-fee-per-km')
  updateShippingFeePerKm(@Body() dto: UpdateShippingFeePeerKmDTO) {
    return this.settingService.updateShippingFeePerKm(dto);
  }
}

import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Default')
@Controller()
export class AppController {
  @Get()
  introductionAPI() {
    return 'This is backend of Hygge cosmetic shop';
  }
}

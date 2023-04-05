import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import {
  CreateBrandDTO,
  GetBrandDTO as GetBrandsDTO,
  UpdateBrandDTO,
} from '../../dto/request';
import { imageFileFilter } from '../../utils/image-file-filter';
import { BrandService } from './brand.service';
import { ValidateMongoId } from '../../utils/validate-pipe';

@ApiTags('Brand')
@Controller('brand')
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('logo', {
      fileFilter: imageFileFilter,
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateBrandDTO })
  async create(
    @Body() body: CreateBrandDTO,
    @UploadedFile() logo: Express.Multer.File,
  ) {
    return await this.brandService.create(body.name, logo);
  }

  @Put('/:id')
  @UseInterceptors(
    FileInterceptor('logo', {
      fileFilter: imageFileFilter,
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateBrandDTO })
  async update(
    @Param('id') id: string,
    @Body() body: UpdateBrandDTO,
    @UploadedFile() logo: Express.Multer.File,
  ) {
    return await this.brandService.update(id, body.name, logo);
  }

  @Delete('/:id')
  async delete(@Param('id') id: string) {
    return await this.brandService.delete(id);
  }

  @Get('/list-name')
  getListBrandName() {
    return this.brandService.getListBrandName();
  }

  @Get()
  getBrands(@Query() query: GetBrandsDTO) {
    if (query.category) {
      return this.brandService.getBrandsByCategory(query.category);
    } else if (query.search) {
      return this.brandService.getBrandBySearchKey(query.search);
    }
    return this.brandService.getBrands();
  }

  @Get('/ranking-sell')
  getBrandRankingSell() {
    return this.brandService.getBrandRankingSell();
  }

  @Get('/:id')
  getBrandNameById(@Param('id', ValidateMongoId) id: string) {
    return this.brandService.getBrandNameById(id);
  }
}

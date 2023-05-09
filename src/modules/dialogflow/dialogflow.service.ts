import { HttpStatus, Injectable } from '@nestjs/common';
import * as dialogflow from 'dialogflow';
import { FacebookService } from './facebook.service';
import * as structjson from '../../utils/structjson';
import { ConfigService } from '@nestjs/config';
import { TagService } from '../tag/tag.service';
import { ProductService } from '../product/product.service';
import { BrandService } from '../brand/brand.service';
import { CategoryService } from '../category/category.service';

@Injectable()
export class DialogflowService {
  private readonly sessionClient: dialogflow.SessionsClient;

  constructor(
    private readonly fbService: FacebookService,
    private readonly configService: ConfigService,
    private readonly tagService: TagService,
    private readonly productService: ProductService,
    private readonly brandService: BrandService,
    private readonly categoryService: CategoryService,
  ) {
    const credentials = {
      client_email: configService.get<string>('GOOGLE_CLIENT_EMAIL'),
      private_key: JSON.parse(configService.get<string>('GOOGLE_PRIVATE_KEY')),
    };
    this.sessionClient = new dialogflow.SessionsClient({
      projectId: configService.get<string>('GOOGLE_PROJECT_ID'),
      credentials,
    });
  }

  async sendTextQueryToDialogFlow(
    sessionIds: Map<string, string>,
    sender: string,
    text: string,
    params: any = {},
  ) {
    const sessionPath = this.sessionClient.sessionPath(
      this.configService.get<string>('GOOGLE_PROJECT_ID'),
      sessionIds.get(sender),
    );
    this.fbService.sendTypingOn(sender);

    const request = {
      session: sessionPath,
      queryInput: {
        text: {
          text: text,
          languageCode: this.configService.get<string>('DF_LANGUAGE_CODE'),
        },
      },
      queryParams: {
        payload: {
          data: params,
        },
      },
    };
    const responses = await this.sessionClient.detectIntent(request);

    const result = responses[0].queryResult;
    return result;
  }

  async sendEventToDialogFlow(
    sessionIds: Map<string, string>,
    sender: string,
    event: string,
    params: any = {},
  ) {
    const sessionPath = this.sessionClient.sessionPath(
      this.configService.get<string>('GOOGLE_PROJECT_ID'),
      sessionIds.get(sender),
    );
    const request = {
      session: sessionPath,
      queryInput: {
        event: {
          name: event,
          parameters: structjson.jsonToStructProto(params), //Dialogflow's v2 API uses gRPC. You'll need a jsonToStructProto method to convert your JavaScript object to a proto struct.
          languageCode: this.configService.get<string>('DF_LANGUAGE_CODE'),
        },
      },
    };

    const responses = await this.sessionClient.detectIntent(request);

    const result = responses[0].queryResult;
    // handleDialogFlowResponse(sender, result);
    return result;
  }

  async getProductFAQ(
    category: string,
    use: string[],
    brand: string,
    skinProblem: string,
    characteristic: string,
    skinType: string,
  ) {
    try {
      const tagsName = [
        category,
        ...use,
        skinProblem,
        characteristic,
        skinType,
      ];

      const tagsId = await this.tagService.findTagByName(tagsName);
      console.log('tagsId: ', tagsId);
      console.log('brand: ', brand);
      const brandId = await this.brandService.getBrandIdByName(brand);

      const prods = await this.productService.getProductItemByTags(
        tagsId,
        brandId,
      );
      return prods;
    } catch (error) {
      console.log('error: ', error);
    }
  }

  async getProductCategoryFAQ(
    categoryName: string,
    skinProblemFacialSkinCare?: string,
  ) {
    const categoryId = await this.categoryService.getCategoryIdByName(
      categoryName,
    );

    if (!categoryId) {
      return [];
    }

    if (skinProblemFacialSkinCare) {
      const tagId = await this.tagService.findTagByName([
        skinProblemFacialSkinCare,
      ]);
      return await this.productService.getProductItemByCategory(
        categoryId,
        tagId[0],
      );
    }
    return await this.productService.getProductItemByCategory(categoryId);
  }
}

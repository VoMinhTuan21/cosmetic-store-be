import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import { FacebookService } from './facebook.service';
import * as dialogflow from 'dialogflow';
import { v4 as uuidv4 } from 'uuid';
import { DialogflowService } from './dialogflow.service';
import { HttpService } from '@nestjs/axios';
import { Request } from 'express';
import {
  MessagingEvent,
  QuickReply,
  WebhookDTO,
} from '../../dto/request/dialogflow.dto';
import { ApiTags } from '@nestjs/swagger';
import { CategoryService } from '../category/category.service';

const credentials = {
  client_email: process.env.GOOGLE_CLIENT_EMAIL,
  private_key: process.env.GOOGLE_PRIVATE_KEY,
};

const sessionClient = new dialogflow.SessionsClient({
  projectId: process.env.GOOGLE_PROJECT_ID,
  credentials,
});

const sessionIds = new Map();

@ApiTags('Dialogflow')
@Controller('dialogflow')
export class DialogflowController {
  constructor(
    private readonly fbService: FacebookService,
    private readonly dialogflowService: DialogflowService,
    private readonly httpService: HttpService,
    private readonly categoryService: CategoryService,
  ) {}

  @Get('/webhook/')
  verification(@Req() req: Request) {
    console.log('request');
    console.log("req.query['hub.mode']: ", req.query['hub.mode']);
    console.log(
      "req.query['hub.verify_token']: ",
      req.query['hub.verify_token'],
    );
    if (
      req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === process.env.FB_VERIFY_TOKEN
    ) {
      return req.query['hub.challenge'];
    } else {
      console.error(
        'Failed validation. Make sure the validation tokens match.',
      );

      throw new HttpException(
        'Failed validation. Make sure the validation tokens match.',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  @Post('/webhook/')
  webhook(@Body() body: any) {
    console.log('body: ', body);
    // Make sure this is a page subscription
    try {
      if (body.object == 'page') {
        // Iterate over each entry
        // There may be multiple if batched

        for (const pageEntry of body.entry) {
          var pageID = pageEntry.id;
          var timeOfEvent = pageEntry.time;

          // Secondary Receiver is in control - listen on standby chanel
          if (pageEntry.standby) {
            // iterate webhook events from standby channel
            pageEntry.standby.forEach((event) => {
              const psid = event.sender.id;
              const message = event.message;

              console.log('psid: ', psid);
              console.log('message: ', message);
            });
          }

          // Bot in control - listen for messages
          if (pageEntry.messaging) {
            // Iterate over each messaging event
            for (const messagingEvent of pageEntry.messaging) {
              if (messagingEvent.optin) {
                this.fbService.receivedAuthentication(messagingEvent);
              } else if (messagingEvent.message) {
                this.receivedMessage(messagingEvent);
              } else if (messagingEvent.delivery) {
                this.fbService.receivedDeliveryConfirmation(messagingEvent);
              } else if (messagingEvent.postback) {
                this.receivedPostback(messagingEvent);
              } else if (messagingEvent.read) {
                this.fbService.receivedMessageRead(messagingEvent);
              } else if (messagingEvent.account_linking) {
                this.fbService.receivedAccountLink(messagingEvent);
              } else {
                console.log(
                  'Webhook received unknown messagingEvent: ',
                  messagingEvent,
                );
              }
            }
          }
        }

        body.entry.forEach(function (pageEntry) {});

        // Assume all went well.
        // You must send back a 200, within 20 seconds
        return 'success';
      }
    } catch (error) {
      console.log('error: ', error);
    }
  }

  //   funtion util

  async receivedMessage(event: MessagingEvent) {
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;
    var timeOfMessage = event.timestamp;
    var message = event.message;

    if (!sessionIds.has(senderID)) {
      sessionIds.set(senderID, uuidv4());
    }
    //console.log("Received message for user %d and page %d at %d with message:", senderID, recipientID, timeOfMessage);
    //console.log(JSON.stringify(message));

    var isEcho = message.is_echo;
    var messageId = message.mid;
    var appId = message.app_id;
    var metadata = message.metadata;

    // You may get a text or attachment but not both
    var messageText = message.text;
    var messageAttachments = message.attachments;
    var quickReply = message.quick_reply;

    if (isEcho) {
      this.fbService.handleEcho(messageId, appId, metadata);
      return;
    } else if (quickReply) {
      this.handleQuickReply(senderID, quickReply, messageId);
      return;
    }

    if (messageText) {
      //send message to api.ai
      const result = await this.dialogflowService.sendTextQueryToDialogFlow(
        sessionIds,
        senderID,
        messageText,
      );

      this.handleDialogFlowResponse(senderID, result);
    } else if (messageAttachments) {
      this.fbService.handleMessageAttachments(messageAttachments, senderID);
    }
  }

  async handleDialogFlowAction(
    sender: string,
    action: string,
    messages: dialogflow.Message[],
    contexts: dialogflow.Context[],
    parameters: any,
  ) {
    switch (action) {
      case 'faq-inquire':
        const commonCategory = [
          'sữa rửa mặt',
          'tẩy trang',
          'toner',
          'mặt nạ',
          'tẩy tế bào chết da mặt',
          'kem nền',
          'kem lót',
          'son thỏi',
          'dầu gội',
          'sữa tắm',
        ];
        let replies: IReply[] = commonCategory.map((cate) => ({
          content_type: 'text',
          payload: cate,
          title: cate,
        }));

        replies.push({
          title: 'Không quan tâm',
          payload: 'Không quan tâm',
          content_type: 'text',
        });

        this.fbService.sendQuickReply(
          sender,
          (messages[0] as dialogflow.TextMessage).text.text[0],
          replies,
        );
        break;

      case 'faq-skin-type':
        let faqCategoryRequiredSkin = contexts.filter(function (el) {
          return el.name.includes('faq-category-required-skin');
        });

        const categoryWithSkin: string =
          faqCategoryRequiredSkin[0].parameters.fields[
            'product-category-required-skin'
          ].stringValue;
        const skinTypeFAQ: string =
          faqCategoryRequiredSkin[0].parameters.fields['skin_type'].stringValue;

        const prodsWithSkinType =
          await this.dialogflowService.getProductCategoryFAQ(
            categoryWithSkin,
            skinTypeFAQ,
          );

        if (prodsWithSkinType.length > 0) {
          const elements = prodsWithSkinType.map((prod) => ({
            title: prod.name,
            image_url: prod.image,
            buttons: [{ type: 'web_url', title: 'Xem ngay', url: prod.url }],
          }));

          this.fbService.handleMessages(messages, sender);

          this.fbService.sendGenericMessage(sender, elements);
        } else {
          this.fbService.sendTextMessage(
            sender,
            'Xin lỗi, tôi không tìm thấy sản phẩm phù hợp với yêu cầu của bạn',
          );
        }
        break;

      case 'faq-category-no-required-skin':
        const categoryWithoutSkin: string =
          parameters.fields['category'].stringValue;

        const prodsWithoutSkin =
          await this.dialogflowService.getProductCategoryFAQ(
            categoryWithoutSkin,
          );

        if (prodsWithoutSkin.length > 0) {
          const elements = prodsWithoutSkin.map((prod) => ({
            title: prod.name,
            image_url: prod.image,
            buttons: [{ type: 'web_url', title: 'Xem ngay', url: prod.url }],
          }));

          this.fbService.handleMessages(messages, sender);

          this.fbService.sendGenericMessage(sender, elements);
        } else {
          this.fbService.sendTextMessage(
            sender,
            'Xin lỗi, tôi không tìm thấy sản phẩm phù hợp với yêu cầu của bạn',
          );
        }
        break;

      case 'faq-facial-skin-care':
        console.log('parameters: ', parameters);
        const categoryFacialSkinCare: string =
          parameters.fields['category'].stringValue;
        const skinProblemFacialSkinCare: string =
          parameters.fields['skin_problem'].stringValue;

        if (skinProblemFacialSkinCare && !categoryFacialSkinCare) {
          const childCategories =
            await this.categoryService.getChildrenCategory(
              '63ea47a39d7b67d0ae6c14fc',
            );
          console.log('childCategories: ', childCategories);

          let replies: IReply[] = childCategories.map((cate) => ({
            content_type: 'text',
            payload: cate.name[0].value,
            title: cate.name[0].value,
          }));

          this.fbService.sendQuickReply(
            sender,
            (messages[0] as dialogflow.TextMessage).text.text[0],
            replies,
          );
        } else if (!skinProblemFacialSkinCare && !categoryFacialSkinCare) {
          this.fbService.handleMessages(messages, sender);
        } else {
          const prods = await this.dialogflowService.getProductCategoryFAQ(
            categoryFacialSkinCare,
            skinProblemFacialSkinCare,
          );

          if (prods.length > 0) {
            const elements = prods.map((prod) => ({
              title: prod.name,
              image_url: prod.image,
              buttons: [{ type: 'web_url', title: 'Xem ngay', url: prod.url }],
            }));

            this.fbService.handleMessages(messages, sender);

            this.fbService.sendGenericMessage(sender, elements);
          } else {
            this.fbService.sendTextMessage(
              sender,
              'Xin lỗi, tôi không tìm thấy sản phẩm phù hợp với yêu cầu của bạn',
            );
          }
        }

        break;

      case 'faq-product':
        const category: string = parameters.fields['category'].stringValue;
        const use: string[] = parameters.fields['use'].listValue.values.map(
          (value: any) => value.stringValue,
        );
        const brand: string = parameters.fields['brand'].stringValue;
        const skinProblem = parameters.fields['skin_problem'].stringValue;
        const characteristic = parameters.fields['characteristic'].stringValue;
        const skinType = parameters.fields['skin_type'].stringValue;

        const prods = await this.dialogflowService.getProductFAQ(
          category,
          use,
          brand,
          skinProblem,
          characteristic,
          skinType,
        );

        if (prods.length > 0) {
          const elements = prods.map((prod) => ({
            title: prod.name,
            image_url: prod.image,
            buttons: [{ type: 'web_url', title: 'Xem ngay', url: prod.url }],
          }));

          this.fbService.handleMessages(messages, sender);

          this.fbService.sendGenericMessage(sender, elements);
        } else {
          this.fbService.sendTextMessage(
            sender,
            'Xin lỗi, tôi không tìm thấy sản phẩm phù hợp với yêu cầu của bạn',
          );
        }

        break;
      case 'talk-human':
        this.fbService.sendPassThread(sender);
        this.fbService.handleMessages(messages, sender);

        break;

      default:
        //unhandled action, just send back the text
        this.fbService.handleMessages(messages, sender);
    }
  }

  async handleQuickReply(
    senderID: string,
    quickReply: QuickReply,
    messageId: string,
  ) {
    var quickReplyPayload = quickReply.payload;
    console.log(
      'Quick reply for message %s with payload %s',
      messageId,
      quickReplyPayload,
    );
    //send payload to api.ai
    const result = await this.dialogflowService.sendTextQueryToDialogFlow(
      sessionIds,
      senderID,
      quickReplyPayload,
    );

    this.handleDialogFlowResponse(senderID, result);
  }

  handleDialogFlowResponse(sender: string, response: dialogflow.QueryResult) {
    let responseText = response.fulfillmentText;

    let messages = response.fulfillmentMessages;
    let action = response.action;
    let contexts = response.outputContexts;
    let parameters = response.parameters;

    this.fbService.sendTypingOff(sender);
    // fix

    if (this.fbService.isDefined(action)) {
      this.handleDialogFlowAction(
        sender,
        action,
        messages,
        contexts,
        parameters,
      );
    } else if (this.fbService.isDefined(messages)) {
      this.fbService.handleMessages(messages, sender);
    } else if (responseText == '' && !this.fbService.isDefined(action)) {
      //dialogflow could not evaluate input.
      this.fbService.sendTextMessage(
        sender,
        "I'm not sure what you want. Can you be more specific?",
      );
    } else if (this.fbService.isDefined(responseText)) {
      this.fbService.sendTextMessage(sender, responseText);
    }
  }

  async receivedPostback(event: MessagingEvent) {
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;
    var timeOfPostback = event.timestamp;

    if (!sessionIds.has(senderID)) {
      sessionIds.set(senderID, uuidv4());
    }

    // The 'payload' param is a developer-defined field which is set in a postback
    // button for Structured Messages.
    var payload = event.postback.payload;

    switch (payload) {
      case 'CARE_HELP':
        this.fbService.sendTextMessage(
          senderID,
          'Bạn đã tắt Bot. Nhân viên tư vấn sẽ chat với bạn trong vòng ít phút nữa',
        );
        this.fbService.sendPassThread(senderID);

        break;
      case 'GET_STARTED':
        this.greetUserText(senderID);
        break;
      default:
        //unindentified payload
        this.fbService.sendTextMessage(
          senderID,
          'Tôi không chắc về cái bạn muốn. Bạn có thể nói cụ thể hơn không?',
        );
        break;
    }

    console.log(
      "Received postback for user %d and page %d with payload '%s' " + 'at %d',
      senderID,
      recipientID,
      payload,
      timeOfPostback,
    );
  }

  sendEmail(title: string, content: string) {
    console.log('content: ', content);
    console.log('title: ', title);
  }

  async greetUserText(userId: string) {
    try {
      const response = await this.httpService.axiosRef.get(
        'https://graph.facebook.com/v16.0/' + userId,
        {
          params: {
            access_token: process.env.FB_PAGE_TOKEN,
          },
        },
      );

      console.log('response.data: ', response.data);
      const user = response.data;
      console.log('getUserData: ', user);
      if (user.first_name) {
        console.log(
          'FB user: %s %s %s',
          user.first_name,
          user.last_name,
          user.profile_pic,
        );
        this.fbService.sendTextMessage(
          userId,
          'Xin chào ' +
            user.first_name +
            ' ' +
            user.last_name +
            ' ! Tôi là chatbot của Hygge không biết tôi có thể giúp gì được cho bạn',
        );
      } else {
        console.log('Can not get data for fb user with id: ', userId);
      }
    } catch (error) {
      console.log('error: ', error);
    }
  }
}

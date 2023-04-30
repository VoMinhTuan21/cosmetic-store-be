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

const credentials = {
  client_email: process.env.GOOGLE_CLIENT_EMAIL,
  private_key: JSON.parse(process.env.GOOGLE_PRIVATE_KEY),
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
  ) {}

  @Get('/webhook')
  verification(@Req() req: Request) {
    console.log('request');
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

  @Post('/webhook')
  webhook(@Body() body: WebhookDTO) {
    // Make sure this is a page subscription
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
  }

  //   funtion util

  receivedMessage(event: MessagingEvent) {
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
      this.dialogflowService.sendTextQueryToDialogFlow(
        sessionIds,
        this.handleDialogFlowResponse,
        senderID,
        messageText,
      );
    } else if (messageAttachments) {
      this.fbService.handleMessageAttachments(messageAttachments, senderID);
    }
  }

  handleDialogFlowAction(
    sender: string,
    action: string,
    messages: dialogflow.Message[],
    contexts: dialogflow.Context[],
    parameters: any,
  ) {
    switch (action) {
      case 'talk-human':
        this.fbService.sendPassThread(sender);
        this.fbService.handleMessages(messages, sender);

        break;
      case 'faq-delivery':
        this.fbService.handleMessages(messages, sender);
        this.fbService.sendTypingOn(sender);

        setTimeout(function () {
          const buttons = [
            {
              type: 'web_url',
              url: 'https://chatbot-messenger-test.vercel.app/',
              title: 'Theo dõi đơn hàng của tôi',
            },
            {
              type: 'phone_number',
              payload: '0987654321',
              title: 'Liên hệ với chúng tôi',
            },
            {
              type: 'postback',
              payload: 'CHAT',
              title: 'Tiếp tục trò chuyện',
            },
          ];

          this.fbService.sendButtonMessage(
            sender,
            'Bạn muốn làm gì tiếp theo?',
            buttons,
          );
        });
        break;
      case 'detail-application':
        let filteredContexts = contexts.filter(function (el) {
          return (
            el.name.includes('job_application') ||
            el.name.includes('job-application-details_dialog_context')
          );
        });
        if (filteredContexts.length > 0 && contexts[0].parameters) {
          let phone_number =
            this.fbService.isDefined(
              contexts[0].parameters.fields['phone-number'],
            ) && contexts[0].parameters.fields['phone-number'] != ''
              ? contexts[0].parameters.fields['phone-number'].stringValue
              : '';
          let user_name =
            this.fbService.isDefined(
              contexts[0].parameters.fields['user-name'],
            ) && contexts[0].parameters.fields['user-name'] != ''
              ? contexts[0].parameters.fields['user-name'].stringValue
              : '';
          let previos_job =
            this.fbService.isDefined(
              contexts[0].parameters.fields['previos-job'],
            ) && contexts[0].parameters.fields['previos-job'] != ''
              ? contexts[0].parameters.fields['previos-job'].stringValue
              : '';
          let year_of_experience =
            this.fbService.isDefined(
              contexts[0].parameters.fields['year-of-experience'],
            ) && contexts[0].parameters.fields['year-of-experience'] != ''
              ? contexts[0].parameters.fields['year-of-experience'].stringValue
              : '';
          let job_vacancy =
            this.fbService.isDefined(
              contexts[0].parameters.fields['job-vacancy'],
            ) && contexts[0].parameters.fields['job-vacancy'] != ''
              ? contexts[0].parameters.fields['job-vacancy'].stringValue
              : '';

          if (
            user_name &&
            previos_job &&
            !phone_number &&
            !year_of_experience
          ) {
            let replies = [
              {
                content_type: 'text',
                title: 'Ít hơn 1 năm',
                payload: 'Ít hơn 1 năm',
              },
              {
                content_type: 'text',
                title: 'Từ 1 đến 2 năm',
                payload: 'Từ 1 đến 2 năm',
              },
              {
                content_type: 'text',
                title: 'Nhiều hơn 2 năm',
                payload: 'Nhiều hơn 2 năm',
              },
            ];
            this.fbService.sendQuickReply(
              sender,
              (messages[0] as dialogflow.TextMessage).text.text[0],
              replies,
            );
          } else if (
            phone_number != '' &&
            user_name != '' &&
            previos_job != '' &&
            year_of_experience != '' &&
            job_vacancy != ''
          ) {
            let emailContent =
              'A new job enquiery from ' +
              user_name +
              ' for the job: ' +
              job_vacancy +
              '.<br> Previous job position: ' +
              previos_job +
              '.' +
              '.<br> Years of experience: ' +
              year_of_experience +
              '.' +
              '.<br> Phone number: ' +
              phone_number +
              '.';
            this.sendEmail('New Job application', emailContent);
            this.fbService.handleMessages(messages, sender);
          } else {
            this.fbService.handleMessages(messages, sender);
          }
        }
        break;

      default:
        //unhandled action, just send back the text
        this.fbService.handleMessages(messages, sender);
    }
  }

  handleQuickReply(
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
    this.dialogflowService.sendTextQueryToDialogFlow(
      sessionIds,
      this.handleDialogFlowResponse,
      senderID,
      quickReplyPayload,
    );
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

  receivedPostback(event: MessagingEvent) {
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
      case 'JOB_APPLY':
        this.dialogflowService.sendEventToDialogFlow(
          sessionIds,
          this.handleDialogFlowResponse,
          senderID,
          'JOB_OPENINGS',
        );
        break;
      case 'CHAT':
        this.fbService.sendTextMessage(
          senderID,
          'Tôi cũng thích trò chuyện. Bạn có câu hỏi gì cần hỏi tôi không?',
        );
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

      const user = JSON.parse(response.data);
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
          'Xin chào ' + user.first_name + user.last_name + '!',
        );
      } else {
        console.log('Can not get data for fb user with id: ', userId);
      }
    } catch (error) {
      console.log('error: ', error);
    }
  }
}

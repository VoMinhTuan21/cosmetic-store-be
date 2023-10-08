import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import * as dialogflow from 'dialogflow';
import {
  Attachment,
  MessageData,
  MessagingEvent,
  ReplyOfQuickReply,
} from '../../dto/request/dialogflow.dto';

@Injectable()
export class FacebookService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async sendPassThread(senderId: string) {
    try {
      const requestBody = {
        recipient: {
          id: senderId,
        },
        target_app_id: this.configService.get<number>('FB_TARGET_APP_ID'),
      };

      await this.httpService.axiosRef.post(
        `https://graph.facebook.com/v16.0/${this.configService.get<number>(
          'FB_PAGE_INBOX_ID',
        )}/pass_thread_control`,
        requestBody,
        {
          params: {
            access_token: this.configService.get<string>('FB_PAGE_TOKEN'),
          },
        },
      );
    } catch (error) {
      console.log('error: ', error);
    }
  }

  handleMessages(messages: dialogflow.Message[], sender: string) {
    // let self = module.exports;
    let timeoutInterval = 1100;
    let previousType: string;
    let cardTypes: dialogflow.Message[] = [];
    let timeout = 0;
    for (var i = 0; i < messages.length; i++) {
      if (
        previousType == 'card' &&
        (messages[i].message != 'card' || i == messages.length - 1)
      ) {
        timeout = (i - 1) * timeoutInterval;
        setTimeout(
          this.handleCardMessages.bind(null, cardTypes, sender),
          timeout,
        );
        cardTypes = [];
        timeout = i * timeoutInterval;
        setTimeout(this.handleMessage.bind(null, messages[i], sender), timeout);
      } else if (messages[i].message == 'card' && i == messages.length - 1) {
        cardTypes.push(messages[i]);
        timeout = (i - 1) * timeoutInterval;
        setTimeout(
          this.handleCardMessages.bind(null, cardTypes, sender),
          timeout,
        );
        cardTypes = [];
      } else if (messages[i].message == 'card') {
        cardTypes.push(messages[i]);
      } else {
        timeout = i * timeoutInterval;
        setTimeout(this.handleMessage.bind(null, messages[i], sender), timeout);
      }

      previousType = messages[i].message;
    }
  }

  handleMessageAttachments(messageAttachments: Attachment[], senderID: string) {
    // let self = module.exports;
    //for now just reply messageAttachments[0].payload.url
    this.sendTextMessage(senderID, 'Attachment received. Thank you.');
  }

  //https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-echo
  handleEcho(messageId: string, appId: number, metadata: string) {
    // Just logging message echoes to console
    console.log(
      'Received echo for message %s and app %d with metadata %s',
      messageId,
      appId,
      metadata,
    );
  }

  handleMessage = (message: dialogflow.Message, sender: string) => {
    // let self = module.exports;
    switch (message.message) {
      case 'text': //text
        for (const text of message.text.text) {
          if (text !== '') {
            this.sendTextMessage(sender, text);
          }
        }
        // message.text.text.forEach((text) => {
        //   if (text !== '') {
        //     self.sendTextMessage(sender, text);
        //   }
        // });
        break;
      case 'quickReplies': //quick replies
        let replies = [];
        message.quickReplies.quickReplies.forEach((text) => {
          let reply = {
            content_type: 'text',
            title: text,
            payload: text,
          };
          replies.push(reply);
        });
        this.sendQuickReply(sender, message.quickReplies.title, replies);
        break;
      case 'image': //image
        this.sendImageMessage(sender, message.image.imageUri);
        break;
    }
  };

  handleCardMessages(messages: dialogflow.CardMessage[], sender: string) {
    let self = module.exports;
    let elements = [];
    for (var m = 0; m < messages.length; m++) {
      let message = messages[m];

      let buttons: IButtonFallBack[] = [];
      for (var b = 0; b < message.card.buttons.length; b++) {
        let isLink =
          message.card.buttons[b].postback.substring(0, 4) === 'http';
        let button: IButtonFallBack;
        if (isLink) {
          button = {
            type: 'web_url',
            title: message.card.buttons[b].text,
            url: message.card.buttons[b].postback,
          };
        } else {
          button = {
            type: 'postback',
            title: message.card.buttons[b].text,
            payload: message.card.buttons[b].postback,
          };
        }
        buttons.push(button);
      }

      let element = {
        title: message.card.title,
        image_url: message.card.imageUri,
        subtitle: message.card.subtitle,
        buttons: buttons,
      };
      elements.push(element);
    }

    this.sendGenericMessage(sender, elements);
  }

  /*
   * Message Read Event
   *
   * This event is called when a previously-sent message has been read.
   * https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-read
   *
   */
  receivedMessageRead(event: MessagingEvent) {
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;

    // All messages before watermark (a timestamp) or sequence have been seen.
    var watermark = event.read.watermark;
    var sequenceNumber = event.read.seq;

    console.log(
      'Received message read event for watermark %d and sequence ' +
        'number %d',
      watermark,
      sequenceNumber,
    );
  }

  /*
   * Account Link Event
   *
   * This event is called when the Link Account or UnLink Account action has been
   * tapped.
   * https://developers.facebook.com/docs/messenger-platform/webhook-reference/account-linking
   *
   */
  receivedAccountLink(event: MessagingEvent) {
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;

    var status = event.account_linking.status;
    var authCode = event.account_linking.authorization_code;

    console.log(
      'Received account link event with for user %d with status %s ' +
        'and auth code %s ',
      senderID,
      status,
      authCode,
    );
  }

  /*
   * Delivery Confirmation Event
   *
   * This event is sent to confirm the delivery of a message. Read more about
   * these fields at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-delivered
   *
   */
  receivedDeliveryConfirmation(event: MessagingEvent) {
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;
    var delivery = event.delivery;
    var messageIDs = delivery.mids;
    var watermark = delivery.watermark;
    var sequenceNumber = delivery.seq;

    if (messageIDs) {
      messageIDs.forEach(function (messageID) {
        console.log(
          'Received delivery confirmation for message ID: %s',
          messageID,
        );
      });
    }

    console.log('All message before %d were delivered.', watermark);
  }

  /*
   * Authorization Event
   *
   * The value for 'optin.ref' is defined in the entry point. For the "Send to
   * Messenger" plugin, it is the 'data-ref' field. Read more at
   * https://developers.facebook.com/docs/messenger-platform/webhook-reference/authentication
   *
   */
  receivedAuthentication(event: MessagingEvent) {
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;
    var timeOfAuth = event.timestamp;
    let self = module.exports;
    // The 'ref' field is set in the 'Send to Messenger' plugin, in the 'data-ref'
    // The developer can set this to an arbitrary value to associate the
    // authentication callback with the 'Send to Messenger' click event. This is
    // a way to do account linking when the user clicks the 'Send to Messenger'
    // plugin.
    var passThroughParam = event.optin.ref;

    console.log(
      'Received authentication for user %d and page %d with pass ' +
        "through param '%s' at %d",
      senderID,
      recipientID,
      passThroughParam,
      timeOfAuth,
    );

    // When an authentication is received, we'll send a message back to the sender
    // to let them know it was successful.
    this.sendTextMessage(senderID, 'Authentication successful');
  }

  /*
   * Verify that the callback came from Facebook. Using the App Secret from
   * the App Dashboard, we can verify the signature that is sent with each
   * callback in the x-hub-signature field, located in the header.
   *
   * https://developers.facebook.com/docs/graph-api/webhooks#setup
   *
   */
  verifyRequestSignature(req, res, buf) {
    var signature = req.headers['x-hub-signature'];
    console.log('verifyRequestSignature');
    if (!signature) {
      throw new Error("Couldn't validate the signature.");
    } else {
      var elements = signature.split('=');
      var method = elements[0];
      var signatureHash = elements[1];

      var expectedHash = crypto
        .createHmac('sha1', this.configService.get<string>('FB_APP_SECRET'))
        .update(buf)
        .digest('hex');

      if (signatureHash != expectedHash) {
        throw new Error("Couldn't validate the request signature.");
        console.log("Couldn't validate the request signature.");
      }
    }
  }

  /*
   * Send a message with a Receipt
   *
   */
  sendReceiptMessage(
    recipientId,
    recipient_name,
    currency,
    payment_method,
    timestamp,
    elements,
    address,
    summary,
    adjustments,
  ) {
    let self = module.exports;
    // Generate a random receipt ID as the API requires a unique ID
    var receiptId = 'order' + Math.floor(Math.random() * 1000);

    var messageData = {
      recipient: {
        id: recipientId,
      },
      message: {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'receipt',
            recipient_name: recipient_name,
            order_number: receiptId,
            currency: currency,
            payment_method: payment_method,
            timestamp: timestamp,
            elements: elements,
            address: address,
            summary: summary,
            adjustments: adjustments,
          },
        },
      },
    };

    this.callSendAPI(messageData);
  }

  /*
   * Send a message with Quick Reply buttons.
   *
   */
  sendQuickReply(
    recipientId: string,
    text: string,
    replies: ReplyOfQuickReply[],
    metadata?: string,
  ) {
    let self = module.exports;
    var messageData = {
      recipient: {
        id: recipientId,
      },
      message: {
        text: text,
        metadata: this.isDefined(metadata) ? metadata : '',
        quick_replies: replies,
      },
    };

    this.callSendAPI(messageData);
  }

  /*
   * Send an image using the Send API.
   *
   */
  sendImageMessage(recipientId: string, imageUrl: string) {
    let self = module.exports;
    var messageData = {
      recipient: {
        id: recipientId,
      },
      message: {
        attachment: {
          type: 'image',
          payload: {
            url: imageUrl,
          },
        },
      },
    };

    this.callSendAPI(messageData);
  }

  /*
   * Send a Gif using the Send API.
   *
   */
  sendGifMessage(recipientId) {
    let self = module.exports;
    var messageData = {
      recipient: {
        id: recipientId,
      },
      message: {
        attachment: {
          type: 'image',
          payload: {
            url:
              this.configService.get<string>('SERVER_URL') +
              '/assets/instagram_logo.gif',
          },
        },
      },
    };

    this.callSendAPI(messageData);
  }

  /*
   * Send audio using the Send API.
   *
   */
  sendAudioMessage(recipientId) {
    let self = module.exports;
    var messageData = {
      recipient: {
        id: recipientId,
      },
      message: {
        attachment: {
          type: 'audio',
          payload: {
            url:
              this.configService.get<string>('SERVER_URL') +
              '/assets/sample.mp3',
          },
        },
      },
    };

    this.callSendAPI(messageData);
  }

  /*
   * Send a video using the Send API.
   * example videoName: "/assets/allofus480.mov"
   */
  sendVideoMessage(recipientId, videoName) {
    let self = module.exports;
    var messageData = {
      recipient: {
        id: recipientId,
      },
      message: {
        attachment: {
          type: 'video',
          payload: {
            url: this.configService.get<string>('SERVER_URL') + videoName,
          },
        },
      },
    };

    this.callSendAPI(messageData);
  }

  /*
   * Send a video using the Send API.
   * example fileName: fileName"/assets/test.txt"
   */
  sendFileMessage(recipientId, fileName) {
    let self = module.exports;
    var messageData = {
      recipient: {
        id: recipientId,
      },
      message: {
        attachment: {
          type: 'file',
          payload: {
            url: this.configService.get<string>('SERVER_URL') + fileName,
          },
        },
      },
    };

    this.callSendAPI(messageData);
  }

  /*
   * Send a button message using the Send API.
   *
   */
  sendButtonMessage(recipientId, text, buttons) {
    let self = module.exports;
    var messageData = {
      recipient: {
        id: recipientId,
      },
      message: {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'button',
            text: text,
            buttons: buttons,
          },
        },
      },
    };

    this.callSendAPI(messageData);
  }

  sendGenericMessage(recipientId, elements) {
    let self = module.exports;
    var messageData = {
      recipient: {
        id: recipientId,
      },
      message: {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'generic',
            elements: elements,
          },
        },
      },
    };

    this.callSendAPI(messageData);
  }
  /*
   * Send a read receipt to indicate the message has been read
   *
   */
  sendReadReceipt(recipientId) {
    let self = module.exports;
    console.log('Sending a read receipt to mark message as seen');

    var messageData = {
      recipient: {
        id: recipientId,
      },
      sender_action: 'mark_seen',
    };

    this.callSendAPI(messageData);
  }
  /*
   * Turn typing indicator on
   *
   */
  sendTypingOn(recipientId: string) {
    let self = module.exports;
    console.log('Turning typing indicator on');

    var messageData = {
      recipient: {
        id: recipientId,
      },
      sender_action: 'typing_on',
    };

    this.callSendAPI(messageData);
  }

  /*
   * Turn typing indicator off
   *
   */
  sendTypingOff(recipientId: string) {
    let self = module.exports;
    console.log('Turning typing indicator off');
    var messageData = {
      recipient: {
        id: recipientId,
      },
      sender_action: 'typing_off',
    };

    this.callSendAPI(messageData);
  }

  /*
   * Send a message with the account linking call-to-action
   *
   */
  sendAccountLinking(recipientId) {
    var messageData = {
      recipient: {
        id: recipientId,
      },
      message: {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'button',
            text: 'Welcome. Link your account.',
            buttons: [
              {
                type: 'account_link',
                url:
                  this.configService.get<string>('SERVER_URL') + '/authorize',
              },
            ],
          },
        },
      },
    };

    this.callSendAPI(messageData);
  }

  sendTextMessage(recipientId: string, text: string) {
    let self = module.exports;
    var messageData = {
      recipient: {
        id: recipientId,
      },
      message: {
        text: text,
      },
    };
    this.callSendAPI(messageData);
  }

  /*
   * Call the Send API. The message data goes in the body. If successful, we'll
   * get the message id in a response
   *
   */
  async callSendAPI(messageData: any) {
    try {
      const response = await this.httpService.axiosRef.post(
        'https://graph.facebook.com/v2.6/me/messages',
        messageData,
        {
          params: {
            access_token: this.configService.get<string>('FB_PAGE_TOKEN'),
          },
        },
      );

      const recipientId = response.data.recipient_id;
      const messageId = response.data.message_id;

      if (messageId) {
        console.log(
          'Successfully sent message with id %s to recipient %s',
          messageId,
          recipientId,
        );
      } else {
        console.log(
          'Successfully called Send API for recipient %s',
          recipientId,
        );
      }
    } catch (error) {
      console.log('error: ', error);
      console.error('Failed calling Send API');
    }
  }

  isDefined(obj: any) {
    if (typeof obj == 'undefined') {
      return false;
    }

    if (!obj) {
      return false;
    }

    return obj != null;
  }
}

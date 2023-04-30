import { ApiProperty } from '@nestjs/swagger';
import { any } from 'joi';

export class WebhookDTO {
  @ApiProperty({ type: String })
  object: string;
  @ApiProperty({ type: String, isArray: true })
  entry: [
    {
      id: string;
      time: number;
      messaging?: MessagingEvent[];
      standby?: [
        {
          sender: {
            id: string;
            user_ref?: string;
          };
          recipient: {
            id: string;
          };
          [index: string]: any;
        },
      ];
    },
  ];
}

export class MessagingEvent {
  sender: {
    id: string;
    user_ref?: string;
  };
  recipient: {
    id: string;
  };
  timestamp: number;
  message?: {
    is_echo?: boolean;
    app_id?: number;
    metadata?: string;
    mid: string;
    text?: string;
    attachments?: [
      {
        type: 'audio' | 'file' | 'image' | 'video' | 'fallback';
        payload: {
          url: string;
          title?: string;
          sticker_id?: number;
        };
      },
    ];
    quick_reply?: QuickReply;
    reply_to?: {
      mid: string;
    };
    referral?: {
      product: {
        id: string;
      };
    };
  };
  postback?: {
    mid: string;
    title: string;
    payload: string;
    referral: {
      ref: string;
      source: string;
      type: string;
    };
  };
  optin?: {
    type: 'notification_messages';
    payload: 'ADDITIONAL-INFORMATION';
    notification_messages_token: 'NOTIFICATION-MESSAGES-TOKEN';
    notification_messages_frequency: 'FREQUENCY';
    notification_messages_timezone: 'TIMEZONE-ID';
    token_expiry_timestamp: 'TIMESTAMP';
    user_token_status: 'TOKEN-STATUS';
    notification_messages_status: 'NOTIFICATION-STATUS';
  };
  delivery?: {
    mids: string[];
    watermark: number;
  };
  read?: {
    watermark: number;
  };
  account_linking?: {
    status: 'linked' | 'unlinked';
    authorization_code: string;
  };
}

export class QuickReply {
  payload: string;
}

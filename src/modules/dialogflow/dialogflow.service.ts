import { Injectable } from '@nestjs/common';
import * as dialogflow from 'dialogflow';
import { FacebookService } from './facebook.service';
import * as structjson from '../../utils/structjson';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DialogflowService {
  private readonly sessionClient: dialogflow.SessionsClient;

  constructor(
    private readonly fbService: FacebookService,
    private readonly configService: ConfigService,
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
}

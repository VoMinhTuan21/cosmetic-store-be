import { Injectable } from '@nestjs/common';
import * as dialogflow from 'dialogflow';
import { FacebookService } from './facebook.service';
import * as structjson from '../../utils/structjson';

const credentials = {
  client_email: process.env.GOOGLE_CLIENT_EMAIL,
  private_key: JSON.parse(process.env.GOOGLE_PRIVATE_KEY as string),
};

const sessionClient = new dialogflow.SessionsClient({
  projectId: process.env.GOOGLE_PROJECT_ID,
  credentials,
});

@Injectable()
export class DialogflowService {
  constructor(private readonly fbService: FacebookService) {}

  async sendTextQueryToDialogFlow(
    sessionIds: Map<string, string>,
    handleDialogFlowResponse: (
      sender: string,
      response: dialogflow.QueryResult,
    ) => void,
    sender: string,
    text: string,
    params: any = {},
  ) {
    const sessionPath = sessionClient.sessionPath(
      process.env.GOOGLE_PROJECT_ID,
      sessionIds.get(sender),
    );
    this.fbService.sendTypingOn(sender);

    const request = {
      session: sessionPath,
      queryInput: {
        text: {
          text: text,
          languageCode: process.env.DF_LANGUAGE_CODE,
        },
      },
      queryParams: {
        payload: {
          data: params,
        },
      },
    };
    const responses = await sessionClient.detectIntent(request);

    const result = responses[0].queryResult;
    handleDialogFlowResponse(sender, result);
  }

  async sendEventToDialogFlow(
    sessionIds: Map<string, string>,
    handleDialogFlowResponse: (
      sender: string,
      response: dialogflow.QueryResult,
    ) => void,
    sender: string,
    event: string,
    params: any = {},
  ) {
    const sessionPath = sessionClient.sessionPath(
      process.env.GOOGLE_PROJECT_ID,
      sessionIds.get(sender),
    );
    const request = {
      session: sessionPath,
      queryInput: {
        event: {
          name: event,
          parameters: structjson.jsonToStructProto(params), //Dialogflow's v2 API uses gRPC. You'll need a jsonToStructProto method to convert your JavaScript object to a proto struct.
          languageCode: process.env.DF_LANGUAGE_CODE,
        },
      },
    };

    const responses = await sessionClient.detectIntent(request);

    const result = responses[0].queryResult;
    handleDialogFlowResponse(sender, result);
  }
}

import { IncomingMessage, ServerResponse } from 'http';
import { ConfigService } from '@nestjs/config';
const configService = new ConfigService();

export async function verifyRequestSignature(
  req: IncomingMessage,
  res: ServerResponse<IncomingMessage>,
  buf: Buffer,
) {
  const signature = req.headers['x-hub-signature'] as string;
  // console.log('verifyRequestSignature');
  if (!signature) {
    throw new Error("Couldn't validate the signature.");
  } else {
    console.log('signature: ', signature);
    const elements = signature.split('=');
    const method = elements[0];
    const signatureHash = elements[1];

    // console.log(
    //   'config.FB_APP_SECRET: ',
    //   configService.get<string>('FB_APP_SECRET'),
    // );
    const { createHmac } = await import('crypto');
    const expectedHash = createHmac(
      'sha1',
      configService.get<string>('FB_APP_SECRET'),
    )
      .update(buf)
      .digest('hex');

    if (signatureHash != expectedHash) {
      throw new Error("Couldn't validate the request signature.");
      console.log("Couldn't validate the request signature.");
    }
  }
}

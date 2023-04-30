import { Request } from 'express';
import crypto from 'crypto';

export function verifyRequestSignature(req: Request, res: any, buf: any) {
  var signature = req.headers['x-hub-signature'] as string;
  console.log('verifyRequestSignature');
  if (!signature) {
    throw new Error("Couldn't validate the signature.");
  } else {
    var elements = signature.split('=');
    var method = elements[0];
    var signatureHash = elements[1];

    var expectedHash = crypto
      .createHmac('sha1', process.env.FB_APP_SECRET)
      .update(buf)
      .digest('hex');

    if (signatureHash != expectedHash) {
      throw new Error("Couldn't validate the request signature.");
      console.log("Couldn't validate the request signature.");
    }
  }
}

import { Context, Response } from '@stackpress/ingest';

export default function NotFound(req: Context, res: Response) {
  if (!res.code && !res.status && !res.sent) {
    //send the response
    res.setHTML('Not Found');
  }
};
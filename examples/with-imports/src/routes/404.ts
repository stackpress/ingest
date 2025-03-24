import { Request, Response } from '@stackpress/ingest';

export default function NotFound(req: Request, res: Response) {
  if (!res.code && !res.status && !res.sent) {
    //send the response
    res.setHTML('Not Found');
  }
};
import { ServerRequest, Response } from '@stackpress/ingest';

export default function Redirect(req: ServerRequest, res: Response) {
  res.redirect('/user');
};
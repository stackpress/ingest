import { Context, Response } from '@stackpress/ingest';

export default function Redirect(req: Context, res: Response) {
  res.redirect('/user');
};
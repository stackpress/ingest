import { Request, Response } from '@stackpress/ingest';

export default function Redirect(req: Request, res: Response) {
  res.redirect('/user');
};
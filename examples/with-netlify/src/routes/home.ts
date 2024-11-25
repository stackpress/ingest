import { Context, Response } from '@stackpress/ingest';

export default async function HomePage(req: Context, res: Response) { 
  res.setHTML('hello');
};
import { Request, Response } from '@stackpress/ingest';

export default async function HomePage(req: Request, res: Response) { 
  res.setHTML('hello');
};
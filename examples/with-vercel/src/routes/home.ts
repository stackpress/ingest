import { Request, Response } from '@stackpress/ingest';

export default async function HomePage(req: Request, res: Response) { 
  const client = req.client as { foo: string };
  res.setHTML(client?.foo);
};
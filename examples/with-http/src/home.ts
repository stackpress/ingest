import type Request from '@stackpress/ingest/dist/payload/Request';
import type Response from '@stackpress/ingest/dist/payload/Response';

export default async function HomePage(req: Request, res: Response) { 
  res.setHTML('hello');
};
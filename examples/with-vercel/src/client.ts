import { bootstrap, Context, Response } from '@stackpress/ingest/fetch';
import type { Config } from './config';

export default async function client(req: Context, res: Response) {
  //bootstrap a new client
  const client = await bootstrap<Config>({
    plugins: [ process.cwd() ]
  });
  //load the plugin routes
  await client.emit('request', req.request, res);
  return client;
};
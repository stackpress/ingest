import { Factory, Context, Response } from '@stackpress/ingest';
import type { Config } from './config';

export default async function client(req: Context, res: Response) {
  //bootstrap a new client
  const client = await Factory.bootstrap<Config>({
    plugins: [ process.cwd() ]
  });
  //load the plugin routes
  await client.emit('request', req.request, res);
  return client;
};
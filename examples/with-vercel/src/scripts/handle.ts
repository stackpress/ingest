import { server } from '@stackpress/ingest/fetch';

export default async function handle(request: Request) {
  //we need to create a new server instance
  const app = server({ cwd: process.cwd() });
  //in order to re bootstrap the server
  await app.bootstrap();
  //now we can handle the request
  return app.handle(request, undefined);
}
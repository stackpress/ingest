import type { HTTPServer } from '@stackpress/ingest';
import type { Config } from './config';

import path from 'path';
import { config } from './config';

export default function plugin(server: HTTPServer<Config>) {
  server.config.set(config);

  const router = server.withEntries;

  router.get('/', path.join(__dirname, 'routes/home'));
  router.get('/login', path.join(__dirname, 'routes/login'));

  router.get('/user', path.join(__dirname, 'routes/user/search'));
  router.post('/user', path.join(__dirname, 'routes/user/create'));
  router.get('/user/:id', path.join(__dirname, 'routes/user/detail'));
  router.put('/user/:id', path.join(__dirname, 'routes/user/update'));
  router.delete('/user/:id', path.join(__dirname, 'routes/user/remove'));

  router.get('/redirect', path.join(__dirname, 'routes/redirect'));
  router.get('/icon.png', path.join(__dirname, 'routes/icon'));
  router.get('/stream', path.join(__dirname, 'routes/stream'));
  router.get('/__sse__', path.join(__dirname, 'routes/sse'));

  router.get('/error', path.join(__dirname, 'routes/error'));
  router.get('/catch', path.join(__dirname, 'routes/catch'));
  router.get('/**', path.join(__dirname, 'routes/404'));

  router.on('error', path.join(__dirname, 'events/error'));

  server.register('project', { welcome: 'Hello, World!!' });
  server.on('request', (req, res) => {
    console.log('Request:', req.url);
  });
}
import type { HTTPServer } from '@stackpress/ingest';
import type { Config } from './config';

import { config } from './config';

export default function plugin(server: HTTPServer<Config>) {
  server.config.set(config);

  const router = server.withImports;

  router.get('/', () => import('./routes/home'));
  router.get('/login', () => import('./routes/login'));

  router.get('/user', () => import('./routes/user/search'));
  router.post('/user', () => import('./routes/user/create'));
  router.get('/user/:id', () => import('./routes/user/detail'));
  router.put('/user/:id', () => import('./routes/user/update'));
  router.delete('/user/:id', () => import('./routes/user/remove'));

  router.get('/redirect', () => import('./routes/redirect'));
  router.get('/icon.png', () => import('./routes/icon'));
  router.get('/stream', () => import('./routes/stream'));
  router.get('/__sse__', () => import('./routes/sse'));

  router.get('/error', () => import('./routes/error'));
  router.get('/catch', () => import('./routes/catch'));
  router.get('/**', () => import('./routes/404'));

  router.on('error', () => import('./events/error'));

  server.register('project', { welcome: 'Hello, World!!' });
  server.on('request', (req, res) => {
    console.log('Request:', req.url);
  });
}
import type { HttpServer } from '@stackpress/ingest';
import type { Config } from './config';

import { config } from './config';

export default function plugin(server: HttpServer<Config>) {
  server.config.set(config);

  server.get('/', () => import('./routes/home'));
  server.get('/login', () => import('./routes/login'));

  server.import.get('/user', () => import('./routes/user/search'));
  server.post('/user', () => import('./routes/user/create'));
  server.get('/user/:id', () => import('./routes/user/detail'));
  server.put('/user/:id', () => import('./routes/user/update'));
  server.delete('/user/:id', () => import('./routes/user/remove'));

  server.get('/redirect', () => import('./routes/redirect'));
  server.get('/icon.png', () => import('./routes/icon'));
  server.get('/stream', () => import('./routes/stream'));
  server.get('/__sse__', () => import('./routes/sse'));

  server.get('/error', () => import('./routes/error'));
  server.get('/catch', () => import('./routes/catch'));
  server.get('/**', () => import('./routes/404'));

  server.on('error', () => import('./events/error'));

  server.register('project', { welcome: 'Hello, World!!' });
  server.on('request', (req, res) => {
    console.log('Request:', req.url);
  });
}
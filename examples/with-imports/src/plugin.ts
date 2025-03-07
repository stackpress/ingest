import type { HttpServer } from '@stackpress/ingest';
import type { Config } from './config';

import { config } from './config';

export default function plugin(server: HttpServer<Config>) {
  server.config.set(config);

  server.imports.get('/', () => import('./routes/home'));
  server.imports.get('/login', () => import('./routes/login'));

  server.imports.get('/user', () => import('./routes/user/search'));
  server.imports.post('/user', () => import('./routes/user/create'));
  server.imports.get('/user/:id', () => import('./routes/user/detail'));
  server.imports.put('/user/:id', () => import('./routes/user/update'));
  server.imports.delete('/user/:id', () => import('./routes/user/remove'));

  server.imports.get('/redirect', () => import('./routes/redirect'));
  server.imports.get('/icon.png', () => import('./routes/icon'));
  server.imports.get('/stream', () => import('./routes/stream'));
  server.imports.get('/__sse__', () => import('./routes/sse'));

  server.imports.get('/error', () => import('./routes/error'));
  server.imports.get('/catch', () => import('./routes/catch'));
  server.imports.get('/**', () => import('./routes/404'));

  server.imports.on('error', () => import('./events/error'));

  server.register('project', { welcome: 'Hello, World!!' });
  server.on('request', (req, res) => {
    console.log('Request:', req.url);
  });
}
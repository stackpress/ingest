import type { HTTPServer } from '@stackpress/ingest';
import type { Config } from './config';

import path from 'path';
import { config } from './config';

export default function plugin(server: HTTPServer<Config>) {
  server.config.set(config);

  server.get('/', path.join(__dirname, 'routes/home'));
  server.get('/login', path.join(__dirname, 'routes/login'));

  server.get('/user', path.join(__dirname, 'routes/user/search'));
  server.post('/user', path.join(__dirname, 'routes/user/create'));
  server.get('/user/:id', path.join(__dirname, 'routes/user/detail'));
  server.put('/user/:id', path.join(__dirname, 'routes/user/update'));
  server.delete('/user/:id', path.join(__dirname, 'routes/user/remove'));

  server.get('/redirect', path.join(__dirname, 'routes/redirect'));
  server.get('/icon.png', path.join(__dirname, 'routes/icon'));
  server.get('/stream', path.join(__dirname, 'routes/stream'));
  server.get('/__sse__', path.join(__dirname, 'routes/sse'));

  server.get('/error', path.join(__dirname, 'routes/error'));
  server.get('/catch', path.join(__dirname, 'routes/catch'));
  server.get('/**', path.join(__dirname, 'routes/404'));

  server.on('error', path.join(__dirname, 'events/error'));

  server.register('project', { welcome: 'Hello, World!!' });
  server.on('request', (req, res) => {
    console.log('Request:', req.url);
  });
}
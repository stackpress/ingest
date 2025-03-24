import type { HttpServer } from '@stackpress/ingest';
import type { Config } from './config';

import path from 'path';
import { config } from './config';

export default function plugin(server: HttpServer<Config>) {
  server.config.set(config);

  server.entry.get('/', path.join(__dirname, 'routes/home'));
  server.entry.get('/login', path.join(__dirname, 'routes/login'));

  server.entry.get('/user', path.join(__dirname, 'routes/user/search'));
  server.entry.post('/user', path.join(__dirname, 'routes/user/create'));
  server.entry.get('/user/:id', path.join(__dirname, 'routes/user/detail'));
  server.entry.put('/user/:id', path.join(__dirname, 'routes/user/update'));
  server.entry.delete('/user/:id', path.join(__dirname, 'routes/user/remove'));

  server.entry.get('/redirect', path.join(__dirname, 'routes/redirect'));
  server.entry.get('/icon.png', path.join(__dirname, 'routes/icon'));
  server.entry.get('/stream', path.join(__dirname, 'routes/stream'));
  server.entry.get('/__sse__', path.join(__dirname, 'routes/sse'));

  server.entry.get('/error', path.join(__dirname, 'routes/error'));
  server.entry.get('/catch', path.join(__dirname, 'routes/catch'));
  server.entry.get('/**', path.join(__dirname, 'routes/404'));

  server.entry.on('error', path.join(__dirname, 'events/error'));

  server.register('project', { welcome: 'Hello, World!!' });
  server.on('request', (req, res) => {
    console.log('Request:', req.url);
  });
}
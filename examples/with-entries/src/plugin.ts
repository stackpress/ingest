import type { HTTPServer } from '@stackpress/ingest';
import type { Config } from './config';

import path from 'path';
import { config } from './config';

export default function plugin(server: HTTPServer<Config>) {
  server.config.set(config);

  server.entries.get('/', path.join(__dirname, 'routes/home'));
  server.entries.get('/login', path.join(__dirname, 'routes/login'));

  server.entries.get('/user', path.join(__dirname, 'routes/user/search'));
  server.entries.post('/user', path.join(__dirname, 'routes/user/create'));
  server.entries.get('/user/:id', path.join(__dirname, 'routes/user/detail'));
  server.entries.put('/user/:id', path.join(__dirname, 'routes/user/update'));
  server.entries.delete('/user/:id', path.join(__dirname, 'routes/user/remove'));

  server.entries.get('/redirect', path.join(__dirname, 'routes/redirect'));
  server.entries.get('/icon.png', path.join(__dirname, 'routes/icon'));
  server.entries.get('/stream', path.join(__dirname, 'routes/stream'));
  server.entries.get('/__sse__', path.join(__dirname, 'routes/sse'));

  server.entries.get('/error', path.join(__dirname, 'routes/error'));
  server.entries.get('/catch', path.join(__dirname, 'routes/catch'));
  server.entries.get('/**', path.join(__dirname, 'routes/404'));

  server.entries.on('error', path.join(__dirname, 'events/error'));

  server.register('project', { welcome: 'Hello, World!!' });
  server.on('request', (req, res) => {
    console.log('Request:', req.url);
  });
}
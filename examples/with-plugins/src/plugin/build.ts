import type { Server } from '@stackpress/ingest/build';
import type { Config } from '../config';

import path from 'path';
import { config } from '../config';

export default function plugin(server: Server<Config>) {
  server.config.set(config);
  server.on('route', _ => {
    const { cwd, mode } = server.config.data.server;
    const routes = mode === 'development' 
      ? path.join(cwd, 'src/routes')
      : path.join(cwd, 'dist/routes');

    server.get('/user', path.resolve(routes, 'user/search'));
    server.post('/user', path.resolve(routes, 'user/create'));
    server.get('/user/:id', path.resolve(routes, 'user/detail'));
    server.put('/user/:id', path.resolve(routes, 'user/update'));
    server.delete('/user/:id', path.resolve(routes, 'user/remove'));

    server.get('/redirect', path.resolve(routes, 'redirect'));
    server.get('/error', path.resolve(routes, 'error'));
    server.get('/login', path.resolve(routes, 'login'));
    server.get('/icon.png', path.resolve(routes, 'icon'));
    server.get('/stream', path.resolve(routes, 'stream'));
    server.get('/__sse__', path.resolve(routes, 'sse'));
    server.get('/', path.resolve(routes, 'home'));

    server.router.emitter.on('error', async (req, res) => {
      const module = path.resolve(routes, 'home');
      const entry = await import(module);
      const action = entry.default;
      delete require.cache[require.resolve(module)];
      return await action(req, res);
    });
  });
}
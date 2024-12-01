import type { Server } from '@stackpress/ingest';

import { config } from './config';

import hooks from './routes/hooks';
import pages from './routes/pages';
import tests from './routes/tests';
import user from './routes/user';

export default function plugin(server: Server) {
  server.config.set(config);
  server.use(pages).use(tests).use(user).use(hooks);
  server.register('project', { welcome: 'Hello, World!!' });
  server.on('request', (req, res) => {
    console.log('Request:', req.url);
  });
};
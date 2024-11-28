import path from 'path';
import type { VercelApp } from './types';

export default function plugin(app: VercelApp) {
  app.config.set({
    server: {
      cwd: process.cwd(),
      mode: process.env.SERVER_ENV || 'development',
    },
    cookie: { path: '/' },
    body: { size: 0 }
  });
  app.on('route', _ => {
    const { cwd, mode } = app.config.data.server;
    const root = path.join(cwd, mode === 'development' ? 'src': 'dist');

    app.get('/user', path.resolve(root, 'routes/user/search'));
    app.post('/user', path.resolve(root, 'routes/user/create'));
    app.get('/user/:id', path.resolve(root, 'routes/user/detail'));
    app.put('/user/:id', path.resolve(root, 'routes/user/update'));
    app.delete('/user/:id', path.resolve(root, 'routes/user/remove'));

    app.get('/redirect', path.resolve(root, 'routes/redirect'));
    app.get('/error', path.resolve(root, 'routes/error'));
    app.get('/login', path.resolve(root, 'routes/login'));
    app.get('/icon.png', path.resolve(root, 'routes/icon'));
    app.get('/stream', path.resolve(root, 'routes/stream'));
    app.get('/__sse__', path.resolve(root, 'routes/sse'));
    app.get('/', path.resolve(root, 'routes/home'));

    app.get('/**', path.resolve(root, 'routes/404'));
  });
}
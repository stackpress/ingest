import path from 'path';
import { server } from '@stackpress/ingest/build';

const build = server();

build.get('/user', path.resolve(__dirname, 'routes/user/search'));
build.post('/user', path.resolve(__dirname, 'routes/user/create'));
build.get('/user/:id', path.resolve(__dirname, 'routes/user/detail'));
build.put('/user/:id', path.resolve(__dirname, 'routes/user/update'));
build.delete('/user/:id', path.resolve(__dirname, 'routes/user/remove'));

build.get('/redirect', path.resolve(__dirname, 'routes/redirect'));
build.get('/error', path.resolve(__dirname, 'routes/error'));
build.get('/login', path.resolve(__dirname, 'routes/login'));
build.get('/icon.png', path.resolve(__dirname, 'routes/icon'));
build.get('/stream', path.resolve(__dirname, 'routes/stream'));
build.get('/__sse__', path.resolve(__dirname, 'routes/sse'));
build.get('/', path.resolve(__dirname, 'routes/home'));

build.get('/**', path.resolve(__dirname, 'routes/404'));

export default build;
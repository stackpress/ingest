import path from 'path';
import vercel from '@stackpress/ingest-vercel';

const server = vercel();

server.get('/user', path.resolve(__dirname, 'routes/user/search'));
server.post('/user', path.resolve(__dirname, 'routes/user/create'));
server.get('/user/:id', path.resolve(__dirname, 'routes/user/detail'));
server.put('/user/:id', path.resolve(__dirname, 'routes/user/update'));
server.delete('/user/:id', path.resolve(__dirname, 'routes/user/remove'));

server.get('/redirect', path.resolve(__dirname, 'routes/redirect'));
server.get('/error', path.resolve(__dirname, 'routes/error'));
server.get('/login', path.resolve(__dirname, 'routes/login'));
server.get('/icon.png', path.resolve(__dirname, 'routes/icon'));
server.get('/stream', path.resolve(__dirname, 'routes/stream'));
server.get('/__sse__', path.resolve(__dirname, 'routes/sse'));
server.get('/', path.resolve(__dirname, 'routes/home'));

server.get('/**', path.resolve(__dirname, 'routes/404'));

export default server;
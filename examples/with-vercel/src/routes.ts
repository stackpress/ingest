import path from 'path';
import vercel from '@stackpress/ingest-vercel';

const server = vercel({ minify: false });

server.get('/user', path.resolve(__dirname, 'user/search'));
server.post('/user', path.resolve(__dirname, 'user/create'));
server.get('/user/:id', path.resolve(__dirname, 'user/detail'));
server.put('/user/:id', path.resolve(__dirname, 'user/update'));
server.delete('/user/:id', path.resolve(__dirname, 'user/remove'));
server.get('/auth/login', path.resolve(__dirname, 'user/login'));

server.get('/**', path.resolve(__dirname, 'catch/404'));

export default server;
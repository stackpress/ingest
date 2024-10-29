import path from 'path';
import http from '@stackpress/ingest/http';

const server = http({ minify: false });

server.get('/auth', path.resolve(__dirname, 'user/index'));
server.get('/user', path.resolve(__dirname, 'user/search'));
server.post('/user', path.resolve(__dirname, 'user/create'));
server.get('/user/:id', path.resolve(__dirname, 'user/detail'));
server.put('/user/:id', path.resolve(__dirname, 'user/update'));
server.delete('/user/:id', path.resolve(__dirname, 'user/remove'));
server.get('/auth/error', path.resolve(__dirname, 'user/error'));
server.get('/auth/login', path.resolve(__dirname, 'user/login'));
server.get('/icon.png', path.resolve(__dirname, 'user/icon'));

server.get('/**', path.resolve(__dirname, 'catch/404'));

export default server;
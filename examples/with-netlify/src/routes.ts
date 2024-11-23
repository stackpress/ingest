import path from 'path';
import netlify from '@stackpress/ingest-netlify';

const server = netlify({ minify: false });

server.get('/user', path.resolve(__dirname, 'routes/user/search'));
server.post('/user', path.resolve(__dirname, 'routes/user/create'));
server.get('/user/:id', path.resolve(__dirname, 'routes/user/detail'));
server.put('/user/:id', path.resolve(__dirname, 'routes/user/update'));
server.delete('/user/:id', path.resolve(__dirname, 'routes/user/remove'));

server.get('/redirect', path.resolve(__dirname, 'routes/redirect'));
server.get('/error', path.resolve(__dirname, 'routes/error'));
server.get('/login', path.resolve(__dirname, 'routes/login'));
server.get('/icon.png', path.resolve(__dirname, 'routes/icon'));
server.get('/', path.resolve(__dirname, 'routes/home'));

server.get('/**', path.resolve(__dirname, 'routes/404'));

export default server;
import path from 'path';
import http from '@stackpress/ingest/http';

const server = http();

server.get('/user/:id/name', path.resolve(__dirname, 'pages/bar'));
server.get('/user/:id/name', path.resolve(__dirname, 'pages/zoo'));
server.on('error', path.resolve(__dirname, 'events/error'));

export default server;
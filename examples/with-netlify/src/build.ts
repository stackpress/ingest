import server from './routes';
server.build().then(({ build }) => {
  console.log('done.', build);
});
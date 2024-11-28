import app from './app';

async function main() {
  //load the plugins
  await app.bootstrap();
  //load the plugin config
  const init = { data: app.config() };
  await app.emit('config', app.request(init), app.response());
  //load the plugin routes
  await app.emit('route', app.request(), app.response());
  //start the server
  app.build().then(({ build }) => {
    console.log('done.', build);
  });
}

main().catch(console.error);
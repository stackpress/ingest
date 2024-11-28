import app from '../app';

async function main() {
  //load the plugins
  await app.bootstrap();
  //load the plugin routes
  await app.emit('route', app.request(), app.response());
  //start the server
  app.build().then(({ build }) => {
    console.log('done.', build);
  });
}

main().catch(console.error);
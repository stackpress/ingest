import app from '../app';

async function main() {
  //load the plugins
  await app.bootstrap();
  //load the plugin routes
  await app.emit('route', app.request(), app.response());
  //start the server
  app.create().listen(3000, () => {
    console.log('Server is running on port 3000');
    console.log('------------------------------');
    console.log(app.router.listeners);
  });
}

main().catch(console.error);
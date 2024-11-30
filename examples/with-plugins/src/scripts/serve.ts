import server from '../server';

async function main() {
  //load the plugins
  await server.bootstrap();
  //load the plugin routes
  await server.emit('route', server.request(), server.response());
  //start the server
  server.create().listen(3000, () => {
    console.log('Server is running on port 3000');
    console.log('------------------------------');
    console.log(server.router.listeners);
  });
}

main().catch(console.error);
import server from '../server';

async function main() {
  //load the plugins
  await server.bootstrap();
  //start the server
  server.create().listen(3000, () => {
    console.log('Server is running on port 3000');
    console.log('------------------------------');
  });
};

main().catch(console.error);
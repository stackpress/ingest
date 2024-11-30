import server from '../server';

async function main() {
  //load the plugins
  await server.bootstrap();
  //load the plugin routes
  await server.emit('route', server.request(), server.response());
  //build() is only available in vercel, netlify, 
  //and other serverless environments
  // server.build().then(({ build }) => {
  //   console.log('done.', build);
  // });
}

main().catch(console.error);
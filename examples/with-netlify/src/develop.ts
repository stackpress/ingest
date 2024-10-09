import server from './routes';
server.develop().listen(3000, () => {
  console.log('Server is running on port 3000');
  console.log('------------------------------');
  console.log(server.router.listeners);
});
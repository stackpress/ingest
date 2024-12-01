//ingest
import { server } from '@stackpress/ingest/http';
//routes
import hooks from './routes/hooks';
import pages from './routes/pages';
import tests from './routes/tests';
import user from './routes/user';

//make a new app
const app = server();
//use the routes
app.use(pages).use(tests).use(user).use(hooks);
//start the server
app.create().listen(3000, () => {
  console.log('Server is running on port 3000');
  console.log('------------------------------');
});
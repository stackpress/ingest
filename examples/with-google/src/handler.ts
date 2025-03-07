import { server } from '@stackpress/ingest/whatwg';
import { HttpFunction } from '@google-cloud/functions-framework';

import pages from './routes/pages';
import user from './routes/user';
import tests from './routes/tests';
import hooks from './routes/hooks';

// Create the server
const app = server();
app.use(pages).use(user).use(hooks).use(tests);

// GCP Cloud Function Handler
export const handler: HttpFunction = async (req: any, res: any) => {
  res.status(200).send('<h1>Hello, World</h1><p>from GCP Cloud Function!</p>');
};

// // Local Server
// app.create().listen(4000, () => {
//   console.log('Server is running on port 4000');
//   console.log('------------------------------');
// });





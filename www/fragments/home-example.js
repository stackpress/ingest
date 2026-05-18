import { server } from '@stackpress/ingest/http';

const app = server();

app.get('/', (req, res) => {
  res.setHTML('<h1>Hello World!</h1>');
});

app.create().listen(3000);
import { task } from '@stackpress/ingest';

export default task(function hello(req, res) {
  console.log('error', req, res);
  res.mimetype = 'text/html';
  res.body = 'Page not found';
});
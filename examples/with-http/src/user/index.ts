import { task } from '@stackpress/ingest/dist/helpers';

export default task(function User(req, res) {
  res.code = 302;
  res.status = 'Found';
  res.headers.set('Location', '/user');
});
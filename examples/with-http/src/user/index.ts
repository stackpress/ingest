import { task } from '@stackpress/ingest/dist/helpers';

export default task(function User(req, res) {
  res.redirect('/user');
});
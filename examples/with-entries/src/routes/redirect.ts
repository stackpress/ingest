import { action } from '@stackpress/ingest';

export default action(function Redirect(req, res) {
  res.redirect('/user');
});
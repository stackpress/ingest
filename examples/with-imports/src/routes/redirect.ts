import { action } from '@stackpress/ingest';

export default action(function Redirect({ res }) {
  res.redirect('/user');
});

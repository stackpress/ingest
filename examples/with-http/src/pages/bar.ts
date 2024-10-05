import { task } from '@stackpress/ingest';

export default task(function bar(req, res, evt) {
  console.log('bar bar bar');
  res.mimetype = 'text/json';
  console.log('bar stage', evt.stage)
  res.body = { id: evt.stage.id, name: 'John Doe' };
});
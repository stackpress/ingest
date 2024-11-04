import { task } from '@stackpress/ingest/dist/helpers';

export default task(function UserUpdate(req, res) {
  //get params
  const ctx = req.ctxFromRoute('/user/:id');
  const id = parseInt(ctx.params.get('id') || '');
  if (!id) {
    res.code = 400;
    res.status = 'Bad Request';
    res.body = { error: 'ID is required' };
    return;
  }
  //get form body
  const form = req.post.get();
  //maybe insert into database?
  const results = { ...form, id, created: new Date().toISOString() };
  //send the response
  res.code = 200;
  res.status = 'OK';
  res.mimetype = 'text/json';
  res.body = results;
});
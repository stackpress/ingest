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
  const form = req.post.get<Record<string, unknown>>();
  //maybe insert into database?
  const results = { ...form, id, created: new Date().toISOString() };
  //send the response
  res.mimetype = 'text/json';
  res.body = results;
});
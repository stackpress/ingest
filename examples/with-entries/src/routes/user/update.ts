import { action } from '@stackpress/ingest';

export default action(function UserUpdate(req, res) {
  //get params
  const id = parseInt(req.data('id') || '');
  if (!id) {
    res.setError('ID is required');
    return;
  }
  //get form body
  const form = req.post();
  //maybe insert into database?
  const results = { ...form, id, created: new Date().toISOString() };
  //send the response
  res.setResults(results);
});
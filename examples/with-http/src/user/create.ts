import { task } from '@stackpress/ingest/dist/helpers';

let id = 0;

export default task(function UserCreate(req, res) {
  //get form body
  const form = req.post.get();
  //maybe insert into database?
  const results = { ...form, id: ++id, created: new Date().toISOString() };
  //send the response
  res.setResults(results);
});
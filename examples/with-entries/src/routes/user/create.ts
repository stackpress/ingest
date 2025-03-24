import { action } from '@stackpress/ingest';

let id = 0;

export default action(function UserCreate(req, res) {
  //get form body
  const form = req.data();
  //maybe insert into database?
  const results = { ...form, id: ++id, created: new Date().toISOString() };
  //send the response
  res.setResults(results);
});
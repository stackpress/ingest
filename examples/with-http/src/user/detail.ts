import { task } from '@stackpress/ingest/dist/helpers';

export default task(function UserDetail(req, res, evt) {
  //get params
  const id = evt.params.params.id;
  if (!id) {
    res.code = 400;
    res.status = 'Bad Request';
    res.body = { error: 'ID is required' };
    return;
  }
  //maybe get from database?
  const results = { 
    id: 1, 
    name: 'John Doe', 
    age: 21, 
    created: new Date().toISOString() 
  };
  //send the response
  res.mimetype = 'text/json';
  res.body = results;
});
import { task } from '@stackpress/ingest/dist/helpers';

export default task(function UserSearch(req, res) {
  //get filters
  //const filters = req.query.get<Record<string, unknown>>('filter');
  //maybe get from database?
  const results = [
    { 
      id: 1, 
      name: 'John Doe', 
      age: 21, 
      created: new Date().toISOString() 
    },
    { 
      id: 2, 
      name: 'Jane Doe', 
      age: 30, 
      created: new Date().toISOString() 
    }
  ];
  //send the response
  res.mimetype = 'text/json';
  res.body = results;
  res.total = 100;
});
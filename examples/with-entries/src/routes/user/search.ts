import { action } from '@stackpress/ingest';

export default action(function UserSearch(req, res) {
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
  res.setRows(results, 100);
});
import { router } from '@stackpress/ingest/fetch';

const route = router();

let id = 0;

/**
 * Example user API search
 */
route.get('/user', function UserSearch(req, res) {
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

/**
 * Example user API create (POST)
 * Need to use Postman to see this...
 */
route.post('/user', function UserCreate(req, res) {
  //get form body
  const form = req.data();
  //maybe insert into database?
  const results = { ...form, id: ++id, created: new Date().toISOString() };
  //send the response
  res.setResults(results);
});

/**
 * Example user API detail
 */
route.get('/user/:id', function UserDetail(req, res) {
  //get params
  const id = parseInt(req.data('id') || '');
  if (!id) {
    res.setError('ID is required');
    return;
  }
  //maybe get from database?
  const results = { 
    id: id, 
    name: 'John Doe', 
    age: 21, 
    created: new Date().toISOString() 
  };
  //send the response
  res.setResults(results);
});
route.put('/user/:id', function UserUpdate(req, res) {
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

/**
 * Example user API delete (DELETE)
 * Need to use Postman to see this...
 */
route.delete('/user/:id', function UserRemove(req, res) {
  //get params
  const id = parseInt(req.data('id') || '');
  if (!id) {
    res.setError('ID is required');
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
  res.setResults(results);
});

export default route;
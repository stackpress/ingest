import { ServerRequest, Response } from '@stackpress/ingest';

export default function UserRemove(req: ServerRequest, res: Response) {
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
};
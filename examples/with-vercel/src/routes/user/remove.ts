import { Context, Response } from '@stackpress/ingest';

export default function UserRemove(req: Context, res: Response) {
  //get params
  const id = parseInt(req.data.get('id') || '');
  if (!id) {
    return res.setError('ID is required');
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
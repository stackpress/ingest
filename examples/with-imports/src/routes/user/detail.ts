import { Request, Response } from '@stackpress/ingest';

export default function UserDetail(req: Request, res: Response) {
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
};
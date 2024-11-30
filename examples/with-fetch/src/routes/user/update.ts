import { Context, Response } from '@stackpress/ingest';

export default function UserUpdate(req: Context, res: Response) {
  //get params
  const id = parseInt(req.data('id') || '');
  if (!id) {
    return res.setError('ID is required');
  }
  //get form body
  const form = req.post();
  //maybe insert into database?
  const results = { ...form, id, created: new Date().toISOString() };
  //send the response
  res.setResults(results);
};
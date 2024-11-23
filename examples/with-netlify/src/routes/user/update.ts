import { Request, Response } from '@stackpress/ingest';

export default function UserUpdate(req: Request, res: Response) {
  //get params
  const ctx = req.ctxFromRoute('/user/:id');
  const id = parseInt(ctx.params.get('id') || '');
  if (!id) {
    return res.setError('ID is required');
  }
  //get form body
  const form = req.post.get();
  //maybe insert into database?
  const results = { ...form, id, created: new Date().toISOString() };
  //send the response
  res.setResults(results);
};
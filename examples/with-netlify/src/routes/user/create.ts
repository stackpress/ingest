import { Request, Response } from '@stackpress/ingest';

let id = 0;

export default function UserCreate(req: Request, res: Response) {
  //get form body
  const form = req.post.get();
  //maybe insert into database?
  const results = { ...form, id: ++id, created: new Date().toISOString() };
  //send the response
  res.setResults(results);
};
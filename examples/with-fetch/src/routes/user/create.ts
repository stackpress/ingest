import { Context, Response } from '@stackpress/ingest';

let id = 0;

export default function UserCreate(req: Context, res: Response) {
  //get form body
  const form = req.data();
  //maybe insert into database?
  const results = { ...form, id: ++id, created: new Date().toISOString() };
  //send the response
  res.setResults(results);
};
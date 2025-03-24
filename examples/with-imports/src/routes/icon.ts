import fs from 'fs';
import path from 'path';
import { Request, Response } from '@stackpress/ingest';

export default async function Icon(req: Request, res: Response) {
  if (res.code || res.status || res.body) return; 
  const file = path.resolve(process.cwd(), 'icon.png'); 
  if (fs.existsSync(file)) {
    res.setBody('image/png', fs.createReadStream(file));
  }
};
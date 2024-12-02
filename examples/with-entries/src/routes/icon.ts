import fs from 'fs';
import path from 'path';
import { ServerRequest, Response } from '@stackpress/ingest';

export default async function Icon(req: ServerRequest, res: Response) {
  if (res.code || res.status || res.body) return; 
  const file = path.resolve(process.cwd(), 'icon.png'); 
  if (fs.existsSync(file)) {
    res.setBody('image/png', fs.createReadStream(file));
  }
};
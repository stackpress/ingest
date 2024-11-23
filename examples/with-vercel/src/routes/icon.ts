import fs from 'fs';
import path from 'path';
import { IM, SR, Request, Response } from '@stackpress/ingest';

export default async function Icon(req: Request<IM>, res: Response<SR>) {
  if (res.code || res.status || res.body) return; 
  const file = path.resolve(process.cwd(), 'icon.png'); 
  if (fs.existsSync(file)) {
    res.stop();
    const response = res.resource as SR;
    response.statusCode = 200;
    response.statusMessage = 'OK';
    fs.createReadStream(file).pipe(response);
    return;
  }
};
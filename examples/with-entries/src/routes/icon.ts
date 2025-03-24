import fs from 'node:fs';
import path from 'node:path';
import { action } from '@stackpress/ingest';

export default action(async function Icon(req, res) {
  if (res.code || res.status || res.body) return; 
  const file = path.resolve(process.cwd(), 'icon.png'); 
  if (fs.existsSync(file)) {
    res.setBody('image/png', fs.createReadStream(file));
  }
});
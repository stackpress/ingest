import fs from 'fs';
import path from 'path';
import { action } from '@stackpress/ingest';

export default action(async function Icon({ res }) {
  if (res.code || res.status || res.body) return; 
  const file = path.resolve(process.cwd(), 'icon.png'); 
  if (fs.existsSync(file)) {
    res.set('image/png', fs.createReadStream(file));
  }
});

import path from 'path';
import vercel from '@stackpress/ingest-vercel';
import type { Config } from './types';

export default vercel<Config>({
  cookie: { path: '/' },
  tsconfig: path.resolve(__dirname, '../tsconfig.json'),
  plugins: [ process.cwd() ]
});
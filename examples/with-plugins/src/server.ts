//types
import type { Config } from './config';
//modules
import path from 'path';
//ingest
import { server } from '@stackpress/ingest/build';
//local
import { config } from './config';

export type { Config };
export { config };

export default server<Config>({
  size: 0,
  cookie: { path: '/' },
  tsconfig: path.resolve(__dirname, '../tsconfig.json')
});
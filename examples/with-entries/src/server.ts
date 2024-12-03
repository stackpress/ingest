//types
import type { Config } from './config';
//ingest
import { server } from '@stackpress/ingest/http';
//local
import { environment } from './config';

export default server<Config>({
  cache: environment === 'production'
});
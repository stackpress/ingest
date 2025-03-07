//types
import type { Config } from './config';
//ingest
import { server } from '@stackpress/ingest/http';

export default server<Config>();
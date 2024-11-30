import type { Factory } from '@stackpress/ingest';
import type { Config } from '../config';

import { config } from '../config';

export default function plugin(client: Factory<Config>) {
  client.config.set(config);
  client.on('request', _ => {
    client.register('project', { welcome: 'Hello, World!!' });
  });
}
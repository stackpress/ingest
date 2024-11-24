//stackpress
import type { BuilderOptions } from '@stackpress/ingest/dist/buildtime/types';
//netlify
import NetlifyBuilder from './Builder';

export * from '@stackpress/ingest/dist/buildtime';

export { NetlifyBuilder };

export default function netlify(options: BuilderOptions = {}) {
  return new NetlifyBuilder(options);
}
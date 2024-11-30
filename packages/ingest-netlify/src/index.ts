//stackpress
import type { 
  ServerOptions, 
  UnknownNest 
} from '@stackpress/ingest/dist/buildtime/types';
//netlify
import NetlifyBuilder from './Builder';

export * from '@stackpress/ingest/dist/buildtime';

export { NetlifyBuilder };

export function bootstrap<
  C extends UnknownNest = UnknownNest
>(options: ServerOptions = {}) {
  return NetlifyBuilder.bootstrap<C>(options);
}

export default function netlify<
  C extends UnknownNest = UnknownNest
>(options: ServerOptions = {}) {
  return new NetlifyBuilder<C>(options);
}
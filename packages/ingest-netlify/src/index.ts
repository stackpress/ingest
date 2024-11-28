//stackpress
import type { 
  FactoryOptions, 
  UnknownNest 
} from '@stackpress/ingest/dist/buildtime/types';
//netlify
import NetlifyFactory from './Factory';

export * from '@stackpress/ingest/dist/buildtime';

export { NetlifyFactory };

export default function netlify<
  C extends UnknownNest = UnknownNest
>(options: FactoryOptions = {}) {
  return new NetlifyFactory<C>(options);
}
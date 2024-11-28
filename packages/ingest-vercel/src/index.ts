//stackpress
import type { 
  FactoryOptions, 
  UnknownNest 
} from '@stackpress/ingest/dist/buildtime/types';
//vercel
import VercelFactory from './Factory';

export * from '@stackpress/ingest/dist/buildtime';

export { VercelFactory };

export default function vercel<
  C extends UnknownNest = UnknownNest
>(options: FactoryOptions = {}) {
  return new VercelFactory<C>(options);
}
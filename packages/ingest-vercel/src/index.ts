//stackpress
import type { 
  BuilderOptions, 
  UnknownNest 
} from '@stackpress/ingest/dist/buildtime/types';
//vercel
import VercelBuilder from './Builder';

export * from '@stackpress/ingest/dist/buildtime';

export { VercelBuilder };

export function bootstrap<
  C extends UnknownNest = UnknownNest
>(options: BuilderOptions = {}) {
  return VercelBuilder.bootstrap<C>(options);
}

export default function vercel<
  C extends UnknownNest = UnknownNest
>(options: BuilderOptions = {}) {
  return new VercelBuilder<C>(options);
}
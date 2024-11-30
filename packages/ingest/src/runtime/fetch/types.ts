//stackpress
import type { UnknownNest } from '@stackpress/types/dist/types';
//common
import type Context from '../../Context';
import type Request from '../../Request';
import type Response from '../../Response';
//local
import type Route from './Route';

export type RouteAction<C extends UnknownNest = UnknownNest> = (
  req: Context<Route<C>>, 
  res: Response
) => void | boolean | Promise<void|boolean>;

export type RouteRequest<C extends UnknownNest = UnknownNest> = Request<Route<C>>;
export type RouteContext<C extends UnknownNest = UnknownNest> = Context<Route<C>>;
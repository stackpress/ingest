//common
import type { UnknownNest } from '../types';
import type Server from '../Server';
//local
import Router from '../Router';

export default class ServerRouter<
  //context (usually the server)
  C extends UnknownNest = UnknownNest,
  //request resource
  R = unknown, 
  //response resource
  S = unknown
> extends Router<R, S, Server<C, R, S>> {};
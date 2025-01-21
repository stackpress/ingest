//modules
import { createServer } from 'node:http';
//stackpress
import type { UnknownNest } from '@stackpress/lib/dist/types';
//common
import type { 
  IM, 
  SR, 
  HTTPServer, 
  HTTPEntryAction,
  ServerOptions,
  NodeServerOptions
} from '../types';
import Router from '../Router';
import Server from '../Server';
//local
import Adapter, { loader, dispatcher } from './Adapter';
import {
  imQueryToObject,
  imToURL,
  readableStreamToReadable
} from './helpers';

export {
  Adapter,
  loader,
  dispatcher,
  imQueryToObject,
  imToURL,
  readableStreamToReadable
};

/**
 * Default server gateway
 */
export function gateway<C extends UnknownNest = UnknownNest>(
  server: HTTPServer<C>
) {
  return (options: NodeServerOptions) => createServer(
    options, 
    (im, sr) => server.handle(im, sr)
  );
};

/**
 * Server request handler
 */
export async function handler<C extends UnknownNest = UnknownNest>(
  context: HTTPServer<C>, 
  request: IM,
  response: SR,
  action?: HTTPEntryAction<C>
) {
  return await Adapter.plug(context, request, response, action);
};

/**
 * Default server factory
 */
export function server<C extends UnknownNest = UnknownNest>(
  options: ServerOptions<C, IM, SR> = {}
) {
  options.gateway = options.gateway || gateway;
  options.handler = options.handler || handler;
  return new Server<C, IM, SR>(options);
};

/**
 * Default router factory
 */
export function router<C extends UnknownNest = UnknownNest>() {
  return new Router<IM, SR, HTTPServer<C>>();
}
//modules
import { createServer } from 'node:http';
import { createServerAdapter } from '@whatwg-node/server';
//stackpress
import type { UnknownNest } from '@stackpress/types/dist/types';
//common
import type { 
  FetchServer,
  NodeRequest,
  NodeResponse,
  NodeOptResponse,
  FetchEntryAction,
  ServerOptions,
  NodeServerOptions
} from '../types';
import Router from '../Router';
import Server from '../Server';
//local
import Adapter, { loader, dispatcher } from './Adapter';
import {
  NativeRequest,
  NativeResponse,
  fetchQueryToObject,
  fetchToURL,
  readableToReadableStream
} from './helpers';

export {
  Adapter,
  loader,
  dispatcher,
  NativeRequest,
  NativeResponse,
  fetchQueryToObject,
  fetchToURL,
  readableToReadableStream
};

/**
 * Default server gateway
 */
export function gateway<C extends UnknownNest = UnknownNest>(
  server: FetchServer<C>
) {
  return (options: NodeServerOptions) => {
    const adapter = createServerAdapter((request: NodeRequest) => {
      return server.handle(request, undefined) as Promise<NodeResponse>;
    });
    return createServer(options, adapter);
  };
};

/**
 * Server request handler
 */
export async function handler<C extends UnknownNest = UnknownNest>(
  context: FetchServer<C>, 
  request: NodeRequest,
  response: NodeOptResponse,
  action?: FetchEntryAction<C>
) {
  return await Adapter.plug(context, request, action);
};

/**
 * Default server factory
 */
export function server<C extends UnknownNest = UnknownNest>(
  options: ServerOptions<C, NodeRequest, NodeOptResponse> = {}
) {
  options.gateway = options.gateway || gateway;
  options.handler = options.handler || handler;
  return new Server<C, NodeRequest, NodeOptResponse>(
    options
  );
};

/**
 * Default router factory
 */
export function router<C extends UnknownNest = UnknownNest>() {
  return new Router<NodeRequest, NodeOptResponse, FetchServer<C>>();
}
//modules
import { createServer } from 'node:http';
import { createServerAdapter } from '@whatwg-node/server';
//stackpress
import type { UnknownNest } from '@stackpress/lib/dist/types';
//common
import type { 
  WhatwgServer,
  NodeRequest,
  NodeResponse,
  NodeOptResponse,
  WhatwgAction,
  ServerOptions,
  NodeServerOptions
} from '../types';
import Router from '../Router';
import Server from '../Server';
//local
import Adapter, { loader, dispatcher } from './Adapter';


export * from './helpers';

export {
  Adapter,
  loader,
  dispatcher
};

/**
 * Default server gateway
 */
export function gateway<C extends UnknownNest = UnknownNest>(
  server: WhatwgServer<C>
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
  context: WhatwgServer<C>, 
  request: NodeRequest,
  response: NodeOptResponse,
  action?: string|WhatwgAction<C>
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
  return new Router<NodeRequest, NodeOptResponse, WhatwgServer<C>>();
}
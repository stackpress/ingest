//modules
import { createServer } from 'node:http';
import { createServerAdapter } from '@whatwg-node/server';
//stackpress
import type { UnknownNest } from '@stackpress/lib/types';
//common
import type { 
  WhatwgServer,
  NodeRequest,
  NodeResponse,
  NodeOptResponse,
  WhatwgAction,
  WhatwgPropsAction,
  ServerOptions,
  NodeServerOptions
} from '../types.js';
import Router from '../Router.js';
import Server from '../Server.js';
//local
import Adapter, { loader, dispatcher } from './Adapter.js';

export {
  isObject,
  objectFromQuery,
  objectFromFormData,
  objectFromJson,
  withUnknownHost,
  formDataToObject,
  cookie,
  session,
  Status,
  Exception,
  ConfigLoader, 
  PluginLoader,
  Request,
  Response,
  Router,
  ActionRouter,
  EntryRouter,
  ImportRouter,
  ViewRouter,
  Server,
  ReadSession,
  WriteSession
} from '../index.js';

export {
  reqToURL,
  reqQueryToObject,
  readableToReadableStream
} from './helpers.js';

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
  _response: NodeOptResponse,
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
export function router() {
  return new Router<NodeRequest, NodeOptResponse>();
}

/**
 * Just a pass along to imply the types 
 * needed for the action arguments
 */
export function action<C extends UnknownNest = UnknownNest>(
  action: WhatwgAction<C>
) {
  return action;
};

action.props = <C extends UnknownNest = any>(action: WhatwgPropsAction<C>) => {
  return function ActionProps(req, res, ctx) {
    return action({ req, res, ctx });
  } as WhatwgAction<C>;
};
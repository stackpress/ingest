//modules
import { createServer } from 'node:http';
import { createServerAdapter } from '@whatwg-node/server';
//stackpress
import { 
  ReadSession, 
  WriteSession, 
  session 
} from '@stackpress/lib/Session';
import Status from '@stackpress/lib/Status';
import cookie from '@stackpress/lib/cookie';
//common
import type { 
  WhatwgServer,
  NodeRequest,
  NodeResponse,
  NodeOptResponse,
  WhatwgAction,
  ConfigMap,
  PluginMap,
  ServerOptions,
  NodeServerOptions
} from '../types.js';
import Router from '../Router.js';
import Request from '../Request.js';
import Response from '../Response.js';
import Server from '../Server.js';
import Exception from '../Exception.js';
import ActionRouter from '../plugin/ActionRouter.js';
import EntryRouter from '../plugin/EntryRouter.js';
import ImportRouter from '../plugin/ImportRouter.js';
import ViewRouter from '../plugin/ViewRouter.js';
import { ConfigLoader, PluginLoader } from '../Loader.js';
//local
import Adapter, { loader, dispatcher } from './Adapter.js';

export {
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
  WriteSession,
  Adapter,
  loader,
  dispatcher
};

export {
  Controller,
  All,
  Connect,
  Delete,
  Get,
  Head,
  mount,
  On,
  Options,
  Patch,
  Post,
  Put,
  Trace
} from '../decorators.js';

export {
  isObject,
  objectFromQuery,
  objectFromFormData,
  objectFromJson,
  withUnknownHost,
  formDataToObject
} from '../helpers.js';

export {
  reqToURL,
  reqQueryToObject,
  readableToReadableStream
} from './helpers.js';

/**
 * Default server gateway
 */
export function gateway<
  C extends ConfigMap = ConfigMap,
  P extends PluginMap = PluginMap
>(
  server: WhatwgServer<C, P>
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
export async function handler<
  C extends ConfigMap = ConfigMap,
  P extends PluginMap = PluginMap
>(
  context: WhatwgServer<C, P>, 
  request: NodeRequest,
  _response: NodeOptResponse,
  action?: string|WhatwgAction<C, P>
) {
  return await Adapter.plug(context, request, action);
};

/**
 * Default server factory
 */
export function server<
  C extends ConfigMap = ConfigMap,
  P extends PluginMap = PluginMap
>(
  options: ServerOptions<NodeRequest, NodeOptResponse, C, P> = {}
) {
  options.gateway = options.gateway || gateway;
  options.handler = options.handler || handler;
  return new Server<NodeRequest, NodeOptResponse, C, P>(
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
export function action<
  C extends ConfigMap = ConfigMap,
  P extends PluginMap = PluginMap
>(
  action: WhatwgAction<C, P>
) {
  return action;
};

//node
import { createServer } from 'node:http';
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
  IM, SR, 
  ConfigMap,
  HttpServer, 
  HttpAction,
  PluginMap,
  ServerOptions,
  NodeServerOptions,
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
  imToURL,
  imQueryToObject,
  readableStreamToReadable
} from './helpers.js';

/**
 * Default server gateway
 */
export function gateway<
  C extends ConfigMap = ConfigMap,
  P extends PluginMap = PluginMap
>(
  server: HttpServer<C, P>
) {
  return (options: NodeServerOptions) => createServer(
    options, 
    (im, sr) => server.handle(im, sr)
  );
};

/**
 * Server request handler
 */
export async function handler<
  C extends ConfigMap = ConfigMap,
  P extends PluginMap = PluginMap
>(
  context: HttpServer<C, P>, 
  request: IM,
  response: SR,
  action?: string|HttpAction<C>
) {
  return await Adapter.plug(context, request, response, action);
};

/**
 * Default server factory
 */
export function server<
  C extends ConfigMap = ConfigMap,
  P extends PluginMap = PluginMap
>(
  options: ServerOptions<IM, SR, C, P> = {}
) {
  options.gateway = options.gateway || gateway;
  options.handler = options.handler || handler;
  return new Server<IM, SR, C, P>(options);
};

/**
 * Default router factory
 */
export function router() {
  return new Router<IM, SR>();
}

/**
 * Just a pass along to imply the types 
 * needed for the action arguments
 */
export function action<
  C extends ConfigMap = ConfigMap,
  P extends PluginMap = PluginMap
>(
  action: HttpAction<C, P>
) {
  return action;
};

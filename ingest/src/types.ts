//modules
import type { 
  IncomingMessage, 
  ServerResponse, 
  ServerOptions as NodeServerOptions,
  Server as NodeServer
} from 'node:http';
//stackpress
import type { 
  Method,
  TaskAction,
  TaskResult,
  UnknownNest,
  FileSystem
} from '@stackpress/lib/types';
//local
import type ActionRouter from './plugin/ActionRouter.js';
import type Request from './Request.js';
import type Response from './Response.js';
import type Router from './Router.js';
import type Server from './Server.js';

export type {
  TypeOf,
  Key,
  NestedObject,
  UnknownNest,
  Scalar,
  Hash,
  ScalarInput,
  FileMeta,
  CallableSet,
  CallableMap,
  CallableNest,
  ResponseStatus,
  Trace,
  ErrorResponse,
  SuccessResponse,
  StatusResponse,
  Item,
  TaskResult,
  TaskAction,
  TaskItem,
  EventMap,
  EventName,
  EventData,
  EventMatch,
  Event,
  EventHook,
  EventExpression,
  Body,
  ResponseDispatcher,
  ResponseOptions,
  Headers,
  Data,
  Query,
  Session,
  Post,
  LoaderResults,
  RequestLoader,
  CallableSession,
  RequestOptions,
  Revision,
  CookieOptions,
  Method,
  Route,
  RouteMap,
  RouteAction,
  RouterContext,
  RouterArgs,
  RouterMap,
  RouterAction,
  FileRecursiveOption,
  FileStat,
  FileStream,
  FileSystem,
  CallSite
} from '@stackpress/lib/types';

//--------------------------------------------------------------------//
// Loader Types

export type ConfigLoaderOptions = {
  cwd?: string,
  fs?: FileSystem,
  key?: string,
  extnames?: string[]
};

export type PluginLoaderOptions = ConfigLoaderOptions & {
  modules?: string, 
  plugins?: string[]
};

//--------------------------------------------------------------------//
// Router Types

//action router
export type ActionRouteProps<R, S, X> = {
  request: Request<R>,
  response: Response<S>,
  context: X,
  req: Request<R>,
  res: Response<S>,
  ctx: X
};
export type ActionRouterArgs<R, S, X> = [
  ActionRouteProps<R, S, X>
];
export type ActionRouterMap<R, S, X> = Record<
  string,
  ActionRouterArgs<R, S, X>
>;
export type ActionRouterAction<R, S, X> = TaskAction<
  ActionRouterArgs<R, S, X>
>;
export type ActionRouterListener<R, S, X> = (
  event: string, 
  action: ActionRouterAction<R, S, X>, 
  priority?: number
) => ActionRouter<R, S, X>;
//entry router
export type EntryRouterTaskItem = { entry: string, priority: number };
//import router
export type ImportRouterAction<R, S, X> = () => Promise<{
  default: ActionRouterAction<R, S, X>
}>;
export type ImportRouterTaskItem<R, S, X> = { 
  import: ImportRouterAction<R, S, X>, 
  priority: number 
};
//view router
export type ViewRouterTaskItem = { entry: string, priority: number };

export type ViewRouterEngine<R, S, X> = (
  filePath: string, 
  ...args: ActionRouterArgs<R, S, X>
) => TaskResult;

export type ViewRouterRender = (
  filePath: string, 
  props?: UnknownNest, 
  options?: UnknownNest
) => string|null|Promise<string|null>;

//main router
//export type RouterContext<R, S, X = undefined> = X extends undefined ? Router<R, S>: X;
export type AnyRouterAction<
  R = unknown, 
  S = unknown,
  X = undefined
> = string
  | ActionRouterAction<R, S, X>
  | ImportRouterAction<R, S, X>;

//can be used in all event and route handlers
export type ActionProps<
  R = unknown, 
  S = unknown, 
  C extends ConfigMap = ConfigMap,
  P extends PluginMap = PluginMap
> = ActionRouteProps<R, S, Server<R, S, C, P>>;

export type AnyActionProps<
  R = any, 
  S = any, 
  C extends ConfigMap = any,
  P extends PluginMap = any
> = ActionRouteProps<R, S, Server<R, S, C, P>>;

//--------------------------------------------------------------------//
// Server Types

export type ConfigMap = UnknownNest;
export type PluginMap = Record<string, unknown>;

export type Infer = { readonly __infer: unique symbol };
export type KnownPlugin<P, K extends string> = K extends keyof P ? P[K] : unknown;
export type ServerProps<
  R = unknown,
  S = unknown,
  C extends ConfigMap = ConfigMap,
  P extends PluginMap = PluginMap
> = ActionRouteProps<
  R,
  S,
  Server<R, S, C, P>
>;

//alias for ActionRouterAction used in Route class
export type ServerAction<
  R = unknown, 
  S = unknown,
  C extends ConfigMap = ConfigMap,
  P extends PluginMap = PluginMap
> = ActionRouterAction<
  R,
  S,
  Server<R, S, C, P>
>;

//used in Server class
export type ServerHandler<
  R = unknown, 
  S = unknown,
  C extends ConfigMap = ConfigMap,
  P extends PluginMap = PluginMap
> = (ctx: Server<R, S, C, P>, req: R, res: S) => Promise<S>;
export type ServerGateway = (options: NodeServerOptions) => NodeServer;
export type ServerOptions<
  R = unknown, 
  S = unknown,
  C extends ConfigMap = ConfigMap,
  P extends PluginMap = PluginMap
> = PluginLoaderOptions & {
  handler?: ServerHandler<R, S, C, P>,
  gateway?: (server: Server<R, S, C, P>) => ServerGateway
};

//--------------------------------------------------------------------//
// Node Types

export { NodeServer, NodeServerOptions };
export type NodeRequest = globalThis.Request;
export type NodeResponse = globalThis.Response;
export type NodeOptResponse = NodeResponse|undefined;

//--------------------------------------------------------------------//
// HTTP Types

export type IM = IncomingMessage;
export type SR = ServerResponse<IncomingMessage>;

export type HttpResponse = Response<SR>;
export type HttpRequest = Request<IM>;
export type HttpRouter = Router<IM, SR>;
export type HttpServer<
  C extends ConfigMap = ConfigMap,
  P extends PluginMap = PluginMap
> = Server<IM, SR, C, P>;
export type HttpServerOptions<
  C extends ConfigMap = ConfigMap,
  P extends PluginMap = PluginMap
> = ServerOptions<IM, SR, C, P>;
export type HttpAction<
  C extends ConfigMap = ConfigMap,
  P extends PluginMap = PluginMap
> = ServerAction<IM, SR, C, P>;

//--------------------------------------------------------------------//
// Whatwg Types

export type WhatwgResponse = Response<NodeOptResponse>;
export type WhatwgRequest = Request<NodeRequest>;
export type WhatwgRouter = Router<NodeRequest, NodeOptResponse>;
export type WhatwgServer<
  C extends ConfigMap = ConfigMap,
  P extends PluginMap = PluginMap
> = Server<NodeRequest, NodeOptResponse, C, P>;
export type WhatwgServerOptions<
  C extends ConfigMap = ConfigMap,
  P extends PluginMap = PluginMap
> = ServerOptions<NodeRequest, NodeOptResponse, C, P>;
export type WhatwgAction<
  C extends ConfigMap = ConfigMap,
  P extends PluginMap = PluginMap
> = ServerAction<NodeRequest, NodeOptResponse, C, P>;

//--------------------------------------------------------------------//
// Decorator Types

export type ControllerProperty = string|symbol;

export type ControllerHandler<
  R = unknown,
  S = unknown,
  X extends Router<R, S> = Router<R, S>
> = ActionRouterAction<R, S, X>;

export type ControllerRouteDefinition = {
  method: Method|'ALL',
  path: string,
  property: ControllerProperty,
  priority: number
};

export type ControllerEventDefinition = {
  event: string|RegExp,
  property: ControllerProperty,
  priority: number
};

export type ControllerMetadata = {
  basePath: string,
  routes: ControllerRouteDefinition[],
  events: ControllerEventDefinition[]
};

export type ControllerInstance = object;

export type ControllerClass = new () => ControllerInstance;

export type ControllerMountable = ControllerClass|ControllerInstance;

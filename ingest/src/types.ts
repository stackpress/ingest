//modules
import type { 
  IncomingMessage, 
  ServerResponse, 
  ServerOptions as NodeServerOptions,
  Server as NodeServer
} from 'node:http';
//stackpress
import type { 
  CallableNest,
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
export type ActionRouteProps<R, S, X, C = unknown, P = unknown> = {
  request: Request<R>,
  response: Response<S>,
  server: X,
  config: C,
  plugin: P,
  req: Request<R>,
  res: Response<S>,
  ctx: X,
  cfg: C,
  plg: P
};
export type ActionRouterArgs<R, S, X, C = unknown, P = unknown> = [
  ActionRouteProps<R, S, X, C, P>
];
export type ActionRouterMap<R, S, X, C = unknown, P = unknown> = Record<
  string,
  ActionRouterArgs<R, S, X, C, P>
>;
export type ActionRouterAction<R, S, X, C = unknown, P = unknown> = TaskAction<
  ActionRouterArgs<R, S, X, C, P>
>;
export type ActionRouterListener<R, S, X, C = unknown, P = unknown> = (
  event: string, 
  action: ActionRouterAction<R, S, X, C, P>, 
  priority?: number
) => ActionRouter<R, S, X, C, P>;
//entry router
export type EntryRouterTaskItem = { entry: string, priority: number };
//import router
export type ImportRouterAction<R, S, X, C = unknown, P = unknown> = () => Promise<{
  default: ActionRouterAction<R, S, X, C, P>
}>;
export type ImportRouterTaskItem<R, S, X, C = unknown, P = unknown> = { 
  import: ImportRouterAction<R, S, X, C, P>, 
  priority: number 
};
//view router
export type ViewRouterTaskItem = { entry: string, priority: number };
export type ViewRouterEngine<
  R = unknown, 
  S = unknown,
  X = undefined
> = (
  filePath: string, 
  req: Request<R>, 
  res: Response<S>,
  ctx: X
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
  X = undefined,
  C = unknown,
  P = unknown
> = string
  | ActionRouterAction<R, S, X, C, P>
  | ImportRouterAction<R, S, X, C, P>;

//--------------------------------------------------------------------//
// Server Types

export type Infer = { readonly __infer: unique symbol };
export type KnownPlugin<P, K extends string> = K extends keyof P ? P[K] : unknown;
export type ServerPlugin<
  P extends Record<string, unknown> = Record<string, unknown>
> = <V = Infer, K extends string = string>(
  name: K
) => V extends Infer ? KnownPlugin<P, K> : V;
export type ServerProps<
  R = unknown,
  S = unknown,
  C extends UnknownNest = UnknownNest,
  P extends Record<string, unknown> = Record<string, unknown>
> = ActionRouteProps<
  R,
  S,
  Server<R, S, C, P>,
  CallableNest<C>,
  ServerPlugin<P>
>;

//alias for ActionRouterAction used in Route class
export type ServerAction<
  R = unknown, 
  S = unknown,
  C extends UnknownNest = UnknownNest,
  P extends Record<string, unknown> = Record<string, unknown>
> = ActionRouterAction<
  R,
  S,
  Server<R, S, C, P>,
  CallableNest<C>,
  ServerPlugin<P>
>;

//used in Server class
export type ServerHandler<
  R = unknown, 
  S = unknown,
  C extends UnknownNest = UnknownNest,
  P extends Record<string, unknown> = Record<string, unknown>
> = (ctx: Server<R, S, C, P>, req: R, res: S) => Promise<S>;
export type ServerGateway = (options: NodeServerOptions) => NodeServer;
export type ServerOptions<
  R = unknown, 
  S = unknown,
  C extends UnknownNest = UnknownNest,
  P extends Record<string, unknown> = Record<string, unknown>
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
  C extends UnknownNest = UnknownNest,
  P extends Record<string, unknown> = Record<string, unknown>
> = Server<IM, SR, C, P>;
export type HttpServerOptions<
  C extends UnknownNest = UnknownNest,
  P extends Record<string, unknown> = Record<string, unknown>
> = ServerOptions<IM, SR, C, P>;
export type HttpAction<
  C extends UnknownNest = UnknownNest,
  P extends Record<string, unknown> = Record<string, unknown>
> = ServerAction<IM, SR, C, P>;

//--------------------------------------------------------------------//
// Whatwg Types

export type WhatwgResponse = Response<NodeOptResponse>;
export type WhatwgRequest = Request<NodeRequest>;
export type WhatwgRouter = Router<NodeRequest, NodeOptResponse>;
export type WhatwgServer<
  C extends UnknownNest = UnknownNest,
  P extends Record<string, unknown> = Record<string, unknown>
> = Server<NodeRequest, NodeOptResponse, C, P>;
export type WhatwgServerOptions<
  C extends UnknownNest = UnknownNest,
  P extends Record<string, unknown> = Record<string, unknown>
> = ServerOptions<NodeRequest, NodeOptResponse, C, P>;
export type WhatwgAction<
  C extends UnknownNest = UnknownNest,
  P extends Record<string, unknown> = Record<string, unknown>
> = ServerAction<NodeRequest, NodeOptResponse, C, P>;

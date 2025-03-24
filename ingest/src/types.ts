//modules
import type { 
  IncomingMessage, 
  ServerResponse, 
  ServerOptions as NodeServerOptions,
  Server as NodeServer
} from 'node:http';
//stackpress
import type { 
  TaskAction,
  TaskResult,
  UnknownNest,
  FileSystem
} from '@stackpress/lib/types';
//local
import type ActionRouter from './router/ActionRouter';
import type Request from './Request';
import type Response from './Response';
import type Router from './Router';
import type Server from './Server';

export type * from '@stackpress/lib/types';

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
export type ActionRouterArgs<R, S, X> = [ Request<R>, Response<S>, X ];
export type ActionRouterMap<R, S, X> = Record<string, ActionRouterArgs<R, S, X>>;
export type ActionRouterAction<R, S, X> = TaskAction<ActionRouterArgs<R, S, X>>;
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
  X = undefined
> = string
  | ActionRouterAction<R, S, X>
  | ImportRouterAction<R, S, X>;

//--------------------------------------------------------------------//
// Server Types

//alias for ActionRouterAction
//used in Route class
export type ServerAction<
  //config map
  C extends UnknownNest = UnknownNest, 
  //request resource
  R = unknown, 
  //response resource
  S = unknown
> = ActionRouterAction<R, S, Server<C, R, S>>;

//used in Server class
export type ServerHandler<
  C extends UnknownNest = UnknownNest, 
  R = unknown, 
  S = unknown
> = (ctx: Server<C, R, S>, req: R, res: S) => Promise<S>;
export type ServerGateway = (options: NodeServerOptions) => NodeServer;
export type ServerOptions<
  C extends UnknownNest = UnknownNest, 
  R = unknown, 
  S = unknown
> = PluginLoaderOptions & {
  handler?: ServerHandler<C, R, S>,
  gateway?: (server: Server<C, R, S>) => ServerGateway
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
  C extends UnknownNest = UnknownNest
> = Server<C, IM, SR>;
export type HttpServerOptions<
  C extends UnknownNest = UnknownNest
> = ServerOptions<C, IM, SR>;
export type HttpAction<
  C extends UnknownNest = UnknownNest
> = ServerAction<C, IM, SR>;

//--------------------------------------------------------------------//
// Whatwg Types

export type WhatwgResponse = Response<NodeOptResponse>;
export type WhatwgRequest = Request<NodeRequest>;
export type WhatwgRouter = Router<NodeRequest, NodeOptResponse>;
export type WhatwgServer<
  C extends UnknownNest = UnknownNest
> = Server<C, NodeRequest, NodeOptResponse>;
export type WhatwgServerOptions<
  C extends UnknownNest = UnknownNest
> = ServerOptions<C, NodeRequest, NodeOptResponse>;
export type WhatwgAction<
  C extends UnknownNest = UnknownNest
> = ServerAction<C, NodeRequest, NodeOptResponse>;




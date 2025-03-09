//modules
import type { 
  IncomingMessage, 
  ServerResponse, 
  ServerOptions as NodeServerOptions,
  Server as NodeServer
} from 'node:http';
import type { Readable } from 'node:stream';
//stackpress
import type { 
  Method, 
  RouterMap,
  RouterAction as RouterActionRR,
  RouterActionResults,
  NestedObject,
  UnknownNest,
  FileSystem
} from '@stackpress/lib/dist/types';
import type EventEmitter from '@stackpress/lib/dist/event/EventEmitter';
//local
import type Request from './Request';
import type Response from './Response';
import type Router from './Router';
import type Server from './Server';
import type { WriteSession } from './Session';

export { UnknownNest };

//--------------------------------------------------------------------//
// Node Types

export { NodeServer, NodeServerOptions };

export type NodeRequest = globalThis.Request;
export type NodeResponse = globalThis.Response;
export type NodeOptResponse = NodeResponse|undefined;

//--------------------------------------------------------------------//
// Payload Types

export type Body = string | Buffer | Uint8Array | Readable | ReadableStream
  | Record<string, unknown> | Array<unknown>;

//--------------------------------------------------------------------//
// Response Types

export type ResponseDispatcher<S = unknown> = (res: Response<S>) => Promise<S>;

export type ResponseInitializer<S = unknown> = { 
  body?: Body,
  headers?: Headers,
  mimetype?: string,
  data?: Data,
  resource?: S
};

//--------------------------------------------------------------------//
// Request Types

export type Headers = Record<string, string|string[]> 
  | Map<string, string|string[]>;
export type Data = Map<string, any> | NestedObject;
export type Query = string | Map<string, any> | NestedObject;
export type Session = Record<string, string> | Map<string, string>;
export type Post = Record<string, unknown> | Map<string, any>;
export type LoaderResults = { body?: Body, post?: Post };
export type RequestLoader<R = unknown, X = unknown> = (
  req: Request<R, X>
) => Promise<LoaderResults|undefined>;

export type CallableSession = (
  (name: string) => string|string[]|undefined
) & WriteSession;

export type RequestInitializer<R = unknown, X = unknown> = {
  resource: R,
  body?: Body,
  context?: X,
  headers?: Headers,
  mimetype?: string,
  data?: Data,
  method?: Method,
  query?: Query,
  post?: Post,
  session?: Session,
  url?: string|URL
};

//--------------------------------------------------------------------//
// Session Types

//this is a revision entry
export type Revision = {
  action: 'set'|'remove',
  value?: string|string[]
};

export type CookieOptions = {
  domain?: string;
  expires?: Date;
  httpOnly?: boolean;
  maxAge?: number;
  path?: string;
  priority?: 'low'|'medium'|'high';
  sameSite?: boolean|'lax'|'strict'|'none';
  secure?: boolean;
};

//--------------------------------------------------------------------//
// HTTP Types

export type IM = IncomingMessage;
export type SR = ServerResponse<IncomingMessage>;

export type HttpResponse = Response<SR>;
export type HttpRequest<
  C extends UnknownNest = UnknownNest
> = Request<IM, HttpServer<C>>;
export type HttpRouter<
  C extends UnknownNest = UnknownNest
> = Router<IM, SR, HttpServer<C>>;
export type HttpServer<
  C extends UnknownNest = UnknownNest
> = Server<C, IM, SR>;
export type HttpServerOptions<
  C extends UnknownNest = UnknownNest
> = ServerOptions<C, IM, SR>;
export type HttpAction<
  C extends UnknownNest = UnknownNest
> = RouterAction<IM, SR, HttpServer<C>>;

//--------------------------------------------------------------------//
// Whatwg Types

export type WhatwgResponse = Response<NodeOptResponse>;
export type WhatwgRequest<
  C extends UnknownNest = UnknownNest
> = Request<NodeRequest, WhatwgServer<C>>;
export type WhatwgRouter<
  C extends UnknownNest = UnknownNest
> = Router<NodeRequest, NodeOptResponse, WhatwgServer<C>>;
export type WhatwgServer<
  C extends UnknownNest = UnknownNest
> = Server<C, NodeRequest, NodeOptResponse>;
export type WhatwgServerOptions<
  C extends UnknownNest = UnknownNest
> = ServerOptions<C, NodeRequest, NodeOptResponse>;
export type WhatwgAction<
  C extends UnknownNest = UnknownNest
> = RouterAction<NodeRequest, NodeOptResponse, WhatwgServer<C>>;

//--------------------------------------------------------------------//
// Loader Types

export type ConfigLoaderOptions = {
  cwd?: string,
  fs?: FileSystem,
  key?: string,
  filenames?: string[]
};

export type PluginLoaderOptions = ConfigLoaderOptions & {
  modules?: string, 
  plugins?: string[]
};

//--------------------------------------------------------------------//
// Router Types

export type RouterAction<
  R = unknown, 
  S = unknown, 
  X = unknown
> = RouterActionRR<Request<R, X>, Response<S>>;

export type RouterImport = () => Promise<{
  //imported routes can be as generic or specific as needed
  default: RouterAction<any, any, any>
}>;

export type RouterQueueArgs<
  R = unknown, 
  S = unknown, 
  X = unknown
> = [ Request<R, X>, Response<S> ];

export type EntryTask = { entry: string, priority: number };
export type ImportTask = { import: RouterImport, priority: number };

export type RouterEmitter<
  R = unknown, 
  S = unknown, 
  X = unknown
> = EventEmitter<RouterMap<Request<R, X>, Response<S>>>;

//--------------------------------------------------------------------//
// Server Types

export type ServerAction<
  //configuration map
  C extends UnknownNest = UnknownNest, 
  //request resource
  R = unknown, 
  //response resource
  S = unknown
> = RouterAction<R, S, Server<C, R, S>>;

export type ServerImport<C extends UnknownNest = UnknownNest> = () => Promise<{ 
  default: RouterAction<
    unknown, 
    unknown, 
    Server<C, Request<unknown, C>, Response<unknown>>
  >
}>;

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

export type ServerRequest<
  C extends UnknownNest = UnknownNest, 
  R = unknown, 
  S = unknown
> = Request<R, Server<C, R, S>>;

//--------------------------------------------------------------------//
// View Types

export type ViewEngine<
  R = unknown, 
  S = unknown, 
  X = unknown
> = (
  filePath: string, 
  req: Request<R, X>, 
  res: Response<S>
) => RouterActionResults;

export type ViewRender = (
  filePath: string, 
  props?: UnknownNest, 
  options?: UnknownNest
) => void|undefined|null|string|Promise<void|undefined|null|string>;
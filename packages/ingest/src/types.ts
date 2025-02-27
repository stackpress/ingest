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
  //see: RouterAction (below)
  //RouterAction as RouterActionRR,
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

export type HTTPResponse = Response<SR>;
export type HTTPRequest<
  C extends UnknownNest = UnknownNest
> = Request<IM, HTTPServer<C>>;
export type HTTPRouter<
  C extends UnknownNest = UnknownNest
> = Router<IM, SR, HTTPServer<C>>;
export type HTTPServer<
  C extends UnknownNest = UnknownNest
> = Server<C, IM, SR>;
export type HTTPServerOptions<
  C extends UnknownNest = UnknownNest
> = ServerOptions<C, IM, SR>;
export type HTTPAction<
  C extends UnknownNest = UnknownNest
> = RouterAction<IM, SR, HTTPServer<C>>;

//--------------------------------------------------------------------//
// Fetch Types

export type FetchResponse = Response<NodeOptResponse>;
export type FetchRequest<
  C extends UnknownNest = UnknownNest
> = Request<NodeRequest, FetchServer<C>>;
export type FetchRouter<
  C extends UnknownNest = UnknownNest
> = Router<NodeRequest, NodeOptResponse, FetchServer<C>>;
export type FetchServer<
  C extends UnknownNest = UnknownNest
> = Server<C, NodeRequest, NodeOptResponse>;
export type FetchServerOptions<
  C extends UnknownNest = UnknownNest
> = ServerOptions<C, NodeRequest, NodeOptResponse>;
export type FetchAction<
  C extends UnknownNest = UnknownNest
> = RouterAction<NodeRequest, NodeOptResponse, FetchServer<C>>;

//--------------------------------------------------------------------//
// Loader Types

export type ConfigLoaderOptions = {
  cache?: boolean,
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

//TODO: Replace with RouterActionRR<Request<R, X>, Response<S>>; when lib is updated
export type RouterAction<
  R = unknown, 
  S = unknown, 
  X = unknown
> = (req: Request<R, X>, res: Response<S>) => void|boolean|undefined|Promise<void|boolean|undefined>

export type RouterImport = () => Promise<{
  //imported routes can be as generic or specific as needed
  default: RouterAction<any, any, any>
}>;


// (req: ServerRequest, res: Response<unknown>) => Promise<void>
// RouterAction<unknown, unknown, Server<Config, IncomingMessage, SR>>
// (req: R, res: S) => void | boolean | Promise<void | boolean>

export type RouterQueueArgs<
  R = unknown, 
  S = unknown, 
  X = unknown
> = [ Request<R, X>, Response<S> ];

export type EntryTask = { entry: string, priority: number };

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
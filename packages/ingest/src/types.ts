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
  RouterAction,
  NestedObject,
  UnknownNest,
  FileSystem
} from '@stackpress/types/dist/types';
import type EventEmitter from '@stackpress/types/dist/event/EventEmitter';
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

//--------------------------------------------------------------------//
// Loader Types

export type ConfigLoaderOptions = {
  cache?: boolean,
  cwd?: string,
  fs?: FileSystem,
  filenames?: string[]
};

export type PluginLoaderOptions = ConfigLoaderOptions & {
  key?: string,
  modules?: string, 
  plugins?: string[]
};

//--------------------------------------------------------------------//
// Router Types

export type RouterQueueArgs<
  R = unknown, 
  S = unknown, 
  X = unknown
> = [ Request<R, X>, Response<S> ];

export type RouterEntry<
  R = unknown, 
  S = unknown, 
  X = unknown
> = string|RouterAction<Request<R, X>, Response<S>>;

export type EntryTask = { entry: string, priority: number };

export type RouterEmitter<
  R = unknown, 
  S = unknown, 
  X = unknown
> = EventEmitter<RouterMap<Request<R, X>, Response<S>>>;

//--------------------------------------------------------------------//
// Server Types

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
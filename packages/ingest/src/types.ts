//modules
import type { IncomingMessage, ServerResponse } from 'http';
import type { Readable } from 'stream';
//stackpress
import type { 
  Event,
  Method, 
  Trace,
  CallableMap,
  CallableNest, 
  NestedObject,
  UnknownNest
} from '@stackpress/types/dist/types';
import type FileSystem from '@stackpress/types/dist/filesystem/FileSystem';
//local
import type Server from './Server';
import type Request from './Request';
import type Response from './Response';
import type { WriteSession } from './Session';

//--------------------------------------------------------------------//
// Payload Types

export type Body = string | Buffer | Uint8Array | Readable | ReadableStream
  | Record<string, unknown> | Array<unknown>;

//--------------------------------------------------------------------//
// Response Types

export type ResponseDispatcher<S = unknown> = (res: Response<S>) => Promise<S>;

export interface ResponseInterface<S = unknown> {
  body: Body|null;
  code: number;
  dispatcher?: ResponseDispatcher<S>;
  error?: string;
  headers: CallableMap<string, string|string[]>;
  mimetype?: string;
  resource?: S;
  sent: boolean;
  stack?: Trace[];
  status: string;
  total: number;
};

export type ResponseInitializer<S = unknown> = { 
  body?: Body,
  headers?: Headers,
  mimetype?: string,
  resource?: S
};

export type ResponseErrorOptions = {
  error: string, 
  errors?: NestedObject<string|string[]>, 
  stack?: Trace[],
  code?: number, 
  status?: string
}

//--------------------------------------------------------------------//
// Request Types

export type Headers = Record<string, string|string[]> 
  | Map<string, string|string[]>;
export type Data = Map<string, any> | NestedObject;
export type Query = string | Map<string, any> | NestedObject;
export type Session = Record<string, string> | Map<string, string>;
export type Post = Record<string, unknown> | Map<string, any>;
export type LoaderResults = { body?: Body, post?: Post };
export type RequestLoader = (req: Request) => Promise<LoaderResults|undefined>;

export type CallableSession = (
  (name: string) => string|string[]|undefined
) & WriteSession;

export interface RequestInterface<R = unknown, C = unknown> {
  body: Body|null;
  context?: C;
  data: CallableNest;
  headers: CallableMap<string, string|string[]>;
  method: Method;
  mimetype: string;
  post: CallableNest;
  query: CallableNest;
  resource?: R;
  session: CallableSession;
  url: URL;
};

export type RequestInitializer<R = unknown, C = unknown> = {
  resource: R,
  body?: Body,
  context?: C,
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
export type IMInitializer<
  C extends UnknownNest = UnknownNest
> = RequestInitializer<IM, Server<C, IM, SR>>;
export type SRInitializer = ResponseInitializer<SR>;

//--------------------------------------------------------------------//
// Fetch Types

export type FetchRequest = globalThis.Request;
export type FetchResponse = globalThis.Response;
export type FetchRequestInitializer<
  C extends UnknownNest = UnknownNest
> = RequestInitializer<FetchRequest, Server<C, IM, SR>>;
export type FetchResponseInitializer = ResponseInitializer<FetchResponse>;
export type NoResponseInitializer = ResponseInitializer<undefined>;

//--------------------------------------------------------------------//
// Loader Types

export type ConfigLoaderOptions = {
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
  C = unknown
> = [RequestInterface<R, C>, ResponseInterface<S>];

export interface Route<R = unknown, S = unknown, C = unknown> 
  extends Event<RouterQueueArgs<R, S, C>> 
{
  keys: Record<string, string>
}

//--------------------------------------------------------------------//
// Server Types

export type ServerHandler<
  C extends UnknownNest = UnknownNest, 
  R = unknown, 
  S = unknown
>  = (ctx: Server<C, R, S>, req: R, res: S) => S;
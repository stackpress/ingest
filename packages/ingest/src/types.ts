//modules
import type { IncomingMessage, ServerResponse } from 'http';
import type { Readable } from 'stream';
//stackpress
import type { 
  Method, 
  Trace, 
  NestedObject
} from '@stackpress/types/dist/types';
import type FileSystem from '@stackpress/types/dist/filesystem/FileSystem';
//local
import type Context from './Context';
import type Factory from './Factory';
import type Request from './Request';
import type Response from './Response';
import type { WriteSession } from './Session';

//--------------------------------------------------------------------//
// Generic Types

//a generic class constructor 
export type Constructor<T> = { new (): T };

//--------------------------------------------------------------------//
// HTTP Types

export type IM = IncomingMessage;
export type SR = ServerResponse<IncomingMessage>;

//--------------------------------------------------------------------//
// Fetch Types

export type FetchRequest = globalThis.Request;
export type FetchResponse = globalThis.Response;

//--------------------------------------------------------------------//
// Payload Types

export type FactoryContext = Context<Factory>;
export type Req = Context<Factory>;
export type Res = Response;

export type Headers = Record<string, string|string[]> 
  | Map<string, string|string[]>;
export type Body = string | Buffer | Uint8Array | Readable | ReadableStream
  | Record<string, unknown> | Array<unknown>;
export type Data = Map<string, any> | NestedObject;
export type Query = string | Map<string, any> | NestedObject;
export type Session = Record<string, string> | Map<string, string>;
export type Post = Record<string, unknown> | Map<string, any>;
export type LoaderResponse = { body?: Body, post?: Post };

export type CallableSession = (
  (name: string) => string|string[]|undefined
) & WriteSession;

export type RequestLoader = (req: Request) => Promise<LoaderResponse|undefined>;
export type ResponseDispatcher = (res: Response) => Promise<void>;

export type ContextInitializer = { 
  args?: Array<string> | Set<string>,
  params?: Record<string, string> | Map<string, string>
};

export type ResponseInitializer = { 
  body?: Body,
  headers?: Headers,
  mimetype?: string,
  resource?: SR|FetchResponse
};
export type RequestInitializer<C = unknown> = {
  body?: Body,
  context?: C,
  headers?: Headers,
  mimetype?: string,
  data?: Data,
  method?: Method,
  query?: Query,
  post?: Post,
  session?: Session,
  url?: string|URL,
  resource?: IM|FetchRequest
};
export type IMRequestInitializer<C = unknown> = RequestInitializer<C> & {
  resource: IM
};
export type SRResponseInitializer = ResponseInitializer & {
  resource: SR
};
export type FetchRequestInitializer<C = unknown> = RequestInitializer<C> & {
  resource: FetchRequest
};
export type FetchResponseInitializer = ResponseInitializer & {
  resource: FetchResponse
};

export type ResponseErrorOptions = {
  error: string, 
  errors?: NestedObject<string|string[]>, 
  stack?: Trace[],
  code?: number, 
  status?: string
}

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

export type RouteOptions = PluginLoaderOptions & {
  cookie?: CookieOptions,
  size?: number
}

//--------------------------------------------------------------------//
// Factory Types

export type FactoryEvents = Record<string, [ Request, Response ]>;
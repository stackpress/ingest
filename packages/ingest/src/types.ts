//modules
import type { IncomingMessage, ServerResponse } from 'http';
//stackpress
import type { Method, NestedObject, Trace } from '@stackpress/types/dist/types';
//local
import type Request from './Request';
import type Response from './Response';

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

export type Headers = Record<string, string|string[]> 
  | Map<string, string|string[]>;
export type Body = string | Buffer | Uint8Array
  | Record<string, unknown> | Array<unknown>;
export type Data = Map<string, any> | NestedObject;
export type Query = string | Map<string, any> | NestedObject;
export type Session = Record<string, string> | Map<string, string>;
export type Post = Record<string, unknown> | Map<string, any>;
export type LoaderResponse = { body?: Body, post?: Post };

export type RequestLoader<R = unknown> = (
  req: Request<R>
) => Promise<LoaderResponse|undefined>;
export type ResponseDispatcher = (res: Response) => Promise<void>;

export type ContextInitializer = { 
  args?: Array<string> | Set<string>,
  params?: Record<string, string> | Map<string, string>
};

export type ResponseInitializer<R = unknown> = { 
  body?: Body,
  headers?: Headers,
  mimetype?: string, 
  resource?: R
};

export type RequestInitializer<R = unknown> = ResponseInitializer<R> & {
  data?: Data,
  method?: Method,
  query?: Query,
  post?: Post,
  session?: Session,
  url?: string|URL
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
// Server Types

export type ServerOptions = {
  cookie?: CookieOptions,
  size?: number
};
import type Request from './Request';
import type Response from './Response';

//--------------------------------------------------------------------//
// Nest Types

export interface NestedObject<T = unknown> {
  [key: Key]: T|NestedObject<T>;
};

export type Scalar = string|number|boolean|null;
export type Hash = NestedObject<Scalar>;
export type ScalarInput = Scalar|Scalar[]|Hash;
export type Key = string|number;
export type FileMeta = {
  data: Buffer|string;
  name: string;
  type: string;
}

//--------------------------------------------------------------------//
// Payload Types

export type Headers = Record<string, string|string[]> 
  | Map<string, string|string[]>;
export type Body = string | Buffer | Uint8Array
  | Record<string, unknown> | Array<unknown>;
export type Query = string | Map<string, any> | NestedObject;
export type Session = Record<string, string> | Map<string, string>;
export type Post = Record<string, unknown> | Map<string, any>;
export type LoaderResponse = { body?: Body, post?: Post };

export type RequestLoader = (req: Request) => Promise<LoaderResponse|undefined>;
export type ResponseDispatcher = (res: Response) => Promise<void>;

export type PayloadInitializer = { 
  type?: string, 
  headers?: Headers,
  body?: Body
};

export type RequestInitializer<T = unknown> = PayloadInitializer & {
  resource?: T,
  url?: string|URL,
  query?: Query,
  session?: Session,
  post?: Post
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


import type Request from '../payload/Request';
import type Response from '../payload/Response';

import type Context from './Context';

//--------------------------------------------------------------------//
// Exception Types

//Abstraction defining what a list of errors should look like
export type ErrorList = Record<string, string|string[]>;

//--------------------------------------------------------------------//
// Nest Types

export interface NestedObject<T = unknown> {
  [key: string|number]: T|NestedObject<T>;
};

export type Scalar = string|number|boolean|null;
export type Hash = NestedObject<Scalar>;
export type ScalarInput = Scalar|Scalar[]|Hash;
export type Index = string|number;
export type FileMeta = {
  data: Buffer|string;
  name: string;
  type: string;
}

//--------------------------------------------------------------------//
// Status Types

//Abstraction defining what a status is
export type StatusCode = {
  code: number, 
  message: string
};

//--------------------------------------------------------------------//
// Task Queue Types

//Abstraction defining what a task runner is
export type TaskRunner = (
  req: Request, 
  res: Response, 
  ctx: Context
) => boolean|void|Promise<boolean|void>;

//Abstraction defining what a task is
export type Task = {
  //The task to be performed
  callback: TaskRunner,
  //The priority of the task, when placed in a queue
  priority: number
};

//--------------------------------------------------------------------//
// Event Emitter Types

/**
 * Abstraction defining what an event is
 */
export type Event = {
  //The name of the event
  event: string;
  //The regexp pattern of the event
  pattern: string;
  //Parameters extracted from the pattern
  parameters: string[];
  //`req` from the `emit()`
  request?: Request;
  //`res` from the `emit()`
  response?: Response;
  //The current callback of the event being emitted
  callback?: Function;
  //The priority of the callback that is currently being emitted
  priority?: number;
}

//All things an event emitter can listen to
export type Listenable = string|RegExp|(string|RegExp)[];

//--------------------------------------------------------------------//
// HTTP Types

export type Method = 'ALL' 
  | 'CONNECT' | 'DELETE'  | 'GET' 
  | 'HEAD'    | 'OPTIONS' | 'PATCH' 
  | 'POST'    | 'PUT'     | 'TRACE';

export type URI = { method: Method, route: string };

//--------------------------------------------------------------------//
// Payload Types

export type Body = string | Buffer | Uint8Array
  | Record<string, unknown> | Array<unknown>;

export type RequestLoader = (req: Request) => Promise<void>;
export type ResponseDispatcher = (res: Response) => Promise<void>;

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
// Framework Types

export type Handler = (
  req: Request, 
  res: Response,
  ctx: unknown
) => Promise<void>;

export type BuildType = 'function' | 'endpoint';

export type SoftRequest = Request|Record<string, any>;
//payload
import type Request from '../payload/Request';
import type Response from '../payload/Response';

//--------------------------------------------------------------------//
// Status Types

//Abstraction defining what a status is
export type StatusCode = {
  code: number, 
  message: string
};

//--------------------------------------------------------------------//
// Event Emitter Types

export type ActionFile = string;
export type ActionCallback<R, S> = (
  request: R, 
  response: S
) => boolean|void|Promise<boolean|void>;

//Abstraction defining what a task is
export type Listener<A> = {
  //The task to be performed
  action: A,
  //The priority of the task, when placed in a queue
  priority: number
};

//All things an event emitter can listen to
export type Listenable = string|RegExp|(string|RegExp)[];

//derrivatives
export type ActionPayloadCallback = ActionCallback<Request, Response>;
export type ListenerFile = Listener<ActionFile>;
export type ListenerPayloadCallback = Listener<ActionPayloadCallback>;

//--------------------------------------------------------------------//
// Router Types

export type Method = 'ALL' 
  | 'CONNECT' | 'DELETE'  | 'GET' 
  | 'HEAD'    | 'OPTIONS' | 'PATCH' 
  | 'POST'    | 'PUT'     | 'TRACE';

export type RouteInfo = { method: Method, path: string };
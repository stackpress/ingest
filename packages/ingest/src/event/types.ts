import type Request from '../payload/Request';
import type Response from '../payload/Response';
import type Event from './Event';

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
export type ActionCallback = (
  request: Request, 
  response: Response, 
  event: Event<ActionCallback>
) => boolean|void|Promise<boolean|void>;

//Abstraction defining what a task is
export type EventListener<A> = {
  //The task to be performed
  action: A,
  //context for the task
  event: Event<A>,
  //The priority of the task, when placed in a queue
  priority: number
};

//Abstraction defining what a task is
export type Listener<A> = {
  //The task to be performed
  action: A,
  //The priority of the task, when placed in a queue
  priority: number
};

//All things an event emitter can listen to
export type Listenable = string|RegExp|(string|RegExp)[];

export type EventType = 'event' | 'route';

export type EventInfo = {
  type: EventType,
  method: Method,
  event: string,
  route: string,
  trigger: string,
  pattern?: RegExp
};

//--------------------------------------------------------------------//
// Router Types

export type Method = 'ALL' 
  | 'CONNECT' | 'DELETE'  | 'GET' 
  | 'HEAD'    | 'OPTIONS' | 'PATCH' 
  | 'POST'    | 'PUT'     | 'TRACE';

export type Route = { method: Method, path: string };
//stackpress
import EventRouter from '@stackpress/types/dist/event/EventRouter';
//local
import type { RouterQueueArgs, UnknownNest } from './types';
import type Server from './Server';
import Request from './Request';
import Response from './Response';
import { routeParams } from './helpers';

/**
 * Generic router class
 * 
 * - all major http methods
 * - generic request<R> and response<S> wrappers
 * - adds route params to request data
 */
export default class Router<
  //request resource
  R = unknown, 
  //response resource
  S = unknown, 
  //context (usually the server)
  X = unknown
> 
  extends EventRouter<Request<R, X>, Response<S>>
{
  /**
   * Returns a task queue for given the event
   */
  public tasks(event: string) {
    const matches = this.match(event);
    const queue = this.makeQueue<RouterQueueArgs<R, S, X>>();

    for (const [ event, match ] of matches) {
      const tasks = this._listeners[event];
      //if no direct observers
      if (typeof tasks === 'undefined') {
        continue;
      }
      //check to see if this is a route
      const route = this.routes.get(event);
      //then loop the observers
      tasks.forEach(task => {
        queue.add(async (req, res) => {
          //set the current
          this._event = { 
            ...match, 
            ...task, 
            args: [ req, res ], 
            action: task.item 
          };
          //ADDING THIS CONDITIONAL
          //if the route is found
          if (route) {
            //extract the params from the route
            const context = routeParams(route.path, req.url.pathname);
            //set the event keys
            this._event.data.params = context.params;
            //add the params to the request data
            req.data.set(context.params);
            //are there any args?
            if (context.args.length) {
              //update the event parameters
              this._event.data.args = context.args;
              //also add the args to the request data
              req.data.set(context.args);
            }
          }
          //before hook
          if (typeof this._before === 'function' 
            && await this._before(this._event) === false
          ) {
            return false;
          }
          //if the method returns false
          if (await task.item(req, res) === false) {
            return false;
          }
          //after hook
          if (typeof this._after === 'function' 
            && await this._after(this._event) === false
          ) {
            return false;
          }
        }, task.priority);
      });
    }

    return queue;
  }
}

export class ServerRouter<
  //context (usually the server)
  C extends UnknownNest = UnknownNest,
  //request resource
  R = unknown, 
  //response resource
  S = unknown
> extends Router<R, S, Server<C, R, S>> {}
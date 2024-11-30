//stackpress
import RouterBase from '@stackpress/types/dist/Router';
//local
import type { 
  Route,
  RouterQueueArgs,
  RequestInterface, 
  ResponseInterface 
} from './types';
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
  C = unknown
> 
  extends RouterBase<RequestInterface<R, C>, ResponseInterface<S>>
{
  protected _event?: Route<R, S, C>;

  /**
   * Returns a task queue for given the event
   */
  public tasks(event: string) {
    const matches = this.match(event);
    const queue = this.makeQueue<RouterQueueArgs<R, S, C>>();

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
            keys: {},
            //args: [ req, res ], 
            //action: task.item 
          };
          if (route) {
            const context = routeParams(route.path, req.url.pathname);
            this._event.keys = context.params;
            req.data.set(context.params);
            if (context.args.length) {
              this._event.parameters = context.args;
              req.data.set(context.args);
            }
          }
          //before hook
          // if (typeof this._before === 'function' 
          //   && await this._before(this._event) === false
          // ) {
          //   return false;
          // }
          //if the method returns false
          if (await task.item(req, res) === false) {
            return false;
          }
          //after hook
          // if (typeof this._after === 'function' 
          //   && await this._after(this._event) === false
          // ) {
          //   return false;
          // }
        }, task.priority);
      });
    }

    return queue;
  }
}
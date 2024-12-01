//stackpress
import { RouterMap } from '@stackpress/types/dist/types';
import EventEmitter from '@stackpress/types/dist/EventEmitter';
import RouterBase from '@stackpress/types/dist/Router';
//local
import type { 
  Route,
  RouterQueueArgs
} from './types';
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
  C = unknown
> 
  extends RouterBase<Request<R, C>, Response<S>>
{
  protected _event?: Route<R, S, C>;

  /**
   * Returns a task queue for given the event
   * TODO: update on next @stackpress/types version
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

  /**
   * Allows events from other emitters to apply here
   * TODO: remove this method on next @stackpress/types version
   */
  use(emitter: EventEmitter<RouterMap<Request<R, C>, Response<S>>>) {
    //check if the emitter is a router
    const router = emitter instanceof Router;
    //first concat their regexp with this one
    emitter.regexp.forEach(pattern => this.regexp.add(pattern));
    //next this listen to what they were listening to
    //event listeners = event -> Set
    //loop through the listeners of the emitter
    for (const event in emitter.listeners) {
      //get the observers
      const tasks = emitter.listeners[event];
      //if no direct observers (shouldn't happen)
      if (typeof tasks === 'undefined') {
        //skip
        continue;
      }
      //if the emitter is a router
      if (router) {
        //get the route from the emitter
        const route = emitter.routes.get(event);
        //set the route
        if (typeof route !== 'undefined') {
          this.routes.set(event, route);
        }
      }
      //then loop the tasks
      for (const { item, priority } of tasks) {
        //listen to each task one by one
        this.on(event, item, priority);
      }
    }
    return this;
  }
}
//stackpress
import type { Method } from '@stackpress/lib/types';
import EventRouter from '@stackpress/lib/EventRouter';
//common
import type { 
  RouterAction,
  RouterActions,
  RouterEmitter,
  RouterImport,
  RouterQueueArgs
} from './types';
import Request from './Request';
import Response from './Response';
import { routeParams } from './helpers';
//local
import ViewRouter from './router/ViewRouter';
import EntryRouter from './router/EntryRouter';
import ImportRouter from './router/ImportRouter';

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
  //Router extensions
  public readonly view: ViewRouter<R, S, X>;
  public readonly entries: EntryRouter<R, S, X>;
  public readonly imports: ImportRouter<R, S, X>;

  /**
   * Determine whether to use require cache
   */
  constructor() {
    super();
    this.view = new ViewRouter<R, S, X>(this);
    this.entries = new EntryRouter<R, S, X>(this);
    this.imports = new ImportRouter<R, S, X>(this);
  }

  /**
   * Route for any method
   */
  public all(
    path: string, 
    action: RouterActions<R, S, X>, 
    priority?: number
  ) {
    return this.route('[A-Z]+', path, action, priority);
  }

  /**
   * Route for CONNECT method
   */
  public connect(
    path: string, 
    action: RouterActions<R, S, X>, 
    priority?: number
  ) {
    return this.route('CONNECT', path, action, priority);
  }

  /**
   * Route for DELETE method
   */
  public delete(
    path: string, 
    action: RouterActions<R, S, X>, 
    priority?: number
  ) {
    return this.route('DELETE', path, action, priority);
  }

  /**
   * Route for GET method
   */
  public get(
    path: string, 
    action: RouterActions<R, S, X>, 
    priority?: number
  ) {
    return this.route('GET', path, action, priority);
  }

  /**
   * Route for HEAD method
   */
  public head(
    path: string, 
    action: RouterActions<R, S, X>, 
    priority?: number
  ) {
    return this.route('HEAD', path, action, priority);
  }

  /**
   * Route for OPTIONS method
   */
  public options(
    path: string, 
    action: RouterActions<R, S, X>, 
    priority?: number
  ) {
    return this.route('OPTIONS', path, action, priority);
  }

  /**
   * Route for PATCH method
   */
  public patch(
    path: string, 
    action: RouterActions<R, S, X>, 
    priority?: number
  ) {
    return this.route('PATCH', path, action, priority);
  }

  /**
   * Route for POST method
   */
  public post(
    path: string, 
    action: RouterActions<R, S, X>, 
    priority?: number
  ) {
    return this.route('POST', path, action, priority);
  }

  /**
   * Route for PUT method
   */
  public put(
    path: string, 
    action: RouterActions<R, S, X>, 
    priority?: number
  ) {
    return this.route('PUT', path, action, priority);
  }

  /**
   * Route for TRACE method
   */
  public trace(
    path: string, 
    action: RouterActions<R, S, X>, 
    priority?: number
  ) {
    return this.route('TRACE', path, action, priority);
  }

  /**
   * Returns a route
   */
  public route(
    method: Method|'[A-Z]+', 
    path: string, 
    action: RouterActions<R, S, X>, 
    priority?: number
  ) {
    //convert path to a regex pattern
    const pattern = path
      //replace the :variable-_name01
      .replace(/(\:[a-zA-Z0-9\-_]+)/g, '*')
      //replace the stars
      //* -> ([^/]+)
      .replaceAll('*', '([^/]+)')
      //** -> ([^/]+)([^/]+) -> (.*)
      .replaceAll('([^/]+)([^/]+)', '(.*)');
    
    //now form the event pattern
    const event = new RegExp(`^${method}\\s${pattern}/*$`, 'ig');
    this.routes.set(event.toString(), {
      method: method === '[A-Z]+' ? 'ALL' : method,
      path: path
    });
  
    //delegate to appropriate router based on action type
    if (typeof action === 'string') {
      //view router for string paths
      this.view.on(event, action, priority);
    } else if (typeof action === 'function' && action.length === 0) {
      //import router for parameterless functions
      this.imports.on(event, action as RouterImport, priority);
    } else {
      //default router for request/response handlers
      this.on(event, action as RouterAction<R, S, X>, priority);
    }

    return this;
  }

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

  /**
   * Allows events from other emitters to apply here
   */
  public use(emitter: RouterEmitter<R, S, X>) {
    //check if the emitter is a router
    const actionRouter = emitter instanceof Router;
    const eventRouter = emitter instanceof EventRouter;
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
      if (eventRouter) {
        //get the route from the source emitter
        const route = emitter.routes.get(event);
        //set the route
        if (typeof route !== 'undefined') {
          this.routes.set(event, route);
        }
        if (actionRouter) {
          //get the entries from the source emitter
          const entries = emitter.entries.entries.get(event);
          //if there are entries
          if (typeof entries !== 'undefined') {
            //if the entries do not exist, create them
            if (!emitter.entries.entries.has(event)) {
              emitter.entries.entries.set(event, new Set());
            }
            //add the entries
            for (const entry of entries) {
              emitter.entries.entries.get(event)?.add(entry);
            }
          }
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
};
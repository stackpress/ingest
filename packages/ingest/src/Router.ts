//stackpress
import type { Method } from '@stackpress/lib/dist/types';
import EventRouter from '@stackpress/lib/dist/event/EventRouter';
//local
import type { 
  EntryTask,
  RouterAction,
  RouterImport,
  RouterEmitter,
  RouterQueueArgs, 
  UnknownNest 
} from './types';
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
  //whether to use require cache
  public readonly cache: boolean;
  //A route map to task queues
  public readonly entries = new Map<string, Set<EntryTask>>();
  //Router entry extension
  public readonly withEntries: RouterEntries<R, S, X>;
  //Router import extension
  public readonly withImports: RouterImports<R, S, X>;

  /**
   * Determine whether to use require cache
   */
  constructor(cache = true) {
    super();
    this.cache = cache;
    this.withEntries = new RouterEntries<R, S, X>(this);
    this.withImports = new RouterImports<R, S, X>(this);
  }

  /**
   * Route for any method
   */
  public all(path: string, action: RouterAction<R, S, X>, priority?: number) {
    return this.route('[A-Z]+', path, action, priority);
  }

  /**
   * Route for CONNECT method
   */
  public connect(path: string, action: RouterAction<R, S, X>, priority?: number) {
    return this.route('CONNECT', path, action, priority);
  }

  /**
   * Route for DELETE method
   */
  public delete(path: string, action: RouterAction<R, S, X>, priority?: number) {
    return this.route('DELETE', path, action, priority);
  }

  /**
   * Route for GET method
   */
  public get(path: string, action: RouterAction<R, S, X>, priority?: number) {
    return this.route('GET', path, action, priority);
  }

  /**
   * Route for HEAD method
   */
  public head(path: string, action: RouterAction<R, S, X>, priority?: number) {
    return this.route('HEAD', path, action, priority);
  }

  /**
   * Route for OPTIONS method
   */
  public options(path: string, action: RouterAction<R, S, X>, priority?: number) {
    return this.route('OPTIONS', path, action, priority);
  }

  /**
   * Route for PATCH method
   */
  public patch(path: string, action: RouterAction<R, S, X>, priority?: number) {
    return this.route('PATCH', path, action, priority);
  }

  /**
   * Route for POST method
   */
  public post(path: string, action: RouterAction<R, S, X>, priority?: number) {
    return this.route('POST', path, action, priority);
  }

  /**
   * Route for PUT method
   */
  public put(path: string, action: RouterAction<R, S, X>, priority?: number) {
    return this.route('PUT', path, action, priority);
  }

  /**
   * Route for TRACE method
   */
  public trace(path: string, action: RouterAction<R, S, X>, priority?: number) {
    return this.route('TRACE', path, action, priority);
  }

  /**
   * Adds a callback to the given event listener
   */
  public on(
    event: string|RegExp, 
    action: RouterAction<R, S, X>,
    priority = 0
  ) {
    if (typeof action !== 'string') {
      super.on(event, action, priority);
      return this;
    }
    //cast entry file
    const entry = action as string;
    //create a key for the entry
    const key = event.toString();
    //if the listener group does not exist, create it
    if (!this.entries.has(key)) {
      this.entries.set(key, new Set());
    }
    //add the listener to the group
    this.entries.get(key)?.add({ entry, priority });
    //scope the emitter
    const emitter = this;
    //now listen for the event
    super.on(event, async function EntryFile(req, res) {
      //import the action
      const imports = await import(entry);
      //get the default export
      const action = imports.default;
      //if dont cache
      if (!emitter.cache) {
        //delete it from the require cache 
        //so it can be processed again
        delete require.cache[require.resolve(entry)];
      }
      //run the action
      //NOTE: it's probably better 
      // to not strongly type this...
      return await action(req, res);
    }, priority);
    return this;
  }

  /**
   * Returns a route
   */
  public route(
    method: Method|'[A-Z]+', 
    path: string, 
    action: RouterAction<R, S, X>, 
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
    //add to tasks
    return this.on(event, action, priority);
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
    const entryRouter = emitter instanceof Router;
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
        if (entryRouter) {
          //get the entries from the source emitter
          const entries = emitter.entries.get(event);
          //if there are entries
          if (typeof entries !== 'undefined') {
            //if the entries do not exist, create them
            if (!this.entries.has(event)) {
              this.entries.set(event, new Set());
            }
            //add the entries
            for (const entry of entries) {
              this.entries.get(event)?.add(entry);
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
}

export class RouterEntries<
  //request resource
  R = unknown, 
  //response resource
  S = unknown, 
  //context (usually the server)
  X = unknown
>  {
  //main router
  protected _router: Router<R, S, X>;
  
  /**
   * Set the router
   */
  constructor(router: Router<R, S, X>) {
    this._router = router;
  }

  /**
   * Route for any method
   */
  public all(path: string, action: string, priority?: number) {
    return this.route('[A-Z]+', path, action, priority);
  }

  /**
   * Route for CONNECT method
   */
  public connect(path: string, action: string, priority?: number) {
    return this.route('CONNECT', path, action, priority);
  }

  /**
   * Route for DELETE method
   */
  public delete(path: string, action: string, priority?: number) {
    return this.route('DELETE', path, action, priority);
  }

  /**
   * Route for GET method
   */
  public get(path: string, action: string, priority?: number) {
    return this.route('GET', path, action, priority);
  }

  /**
   * Route for HEAD method
   */
  public head(path: string, action: string, priority?: number) {
    return this.route('HEAD', path, action, priority);
  }

  /**
   * Route for OPTIONS method
   */
  public options(path: string, action: string, priority?: number) {
    return this.route('OPTIONS', path, action, priority);
  }

  /**
   * Route for PATCH method
   */
  public patch(path: string, action: string, priority?: number) {
    return this.route('PATCH', path, action, priority);
  }

  /**
   * Route for POST method
   */
  public post(path: string, action: string, priority?: number) {
    return this.route('POST', path, action, priority);
  }

  /**
   * Route for PUT method
   */
  public put(path: string, action: string, priority?: number) {
    return this.route('PUT', path, action, priority);
  }

  /**
   * Route for TRACE method
   */
  public trace(path: string, action: string, priority?: number) {
    return this.route('TRACE', path, action, priority);
  }

  /**
   * Makes an entry action
   */
  public make(entry: string) {
    const router = this._router;
    return async function EntryFile(req: Request<R, X>, res: Response<S>) {
      //import the action
      const imports = await import(entry);
      //get the default export
      const action = imports.default;
      //if dont cache
      if (!router.cache) {
        //delete it from the require cache 
        //so it can be processed again
        delete require.cache[require.resolve(entry)];
      }
      //run the action
      //NOTE: it's probably better 
      // to not strongly type this...
      return await action(req, res);
    }
  }

  /**
   * Adds a callback to the given event listener
   */
  public on(
    event: string|RegExp, 
    entry: string,
    priority = 0
  ) {
    //get all the router entries
    const entries = this._router.entries;
    //create a key for the entry
    const key = event.toString();
    //if the listener group does not exist, create it
    if (!entries.has(key)) {
      entries.set(key, new Set());
    }
    //add the listener to the group
    entries.get(key)?.add({ entry, priority });
    //now listen for the event
    this._router.on(event, this.make(entry), priority);
    return this;
  }

  /**
   * Returns a route
   */
  public route(
    method: Method|'[A-Z]+', 
    path: string, 
    entry: string,
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
    this._router.routes.set(event.toString(), {
      method: method === '[A-Z]+' ? 'ALL' : method,
      path: path
    });
    //add to tasks
    return this.on(event, entry, priority);
  }
}

export class RouterImports<
  //request resource
  R = unknown, 
  //response resource
  S = unknown, 
  //context (usually the server)
  X = unknown
>  {
  //main router
  protected _router: Router<R, S, X>;
  
  /**
   * Set the router
   */
  constructor(router: Router<R, S, X>) {
    this._router = router;
  }

  /**
   * Route for any method
   */
  public all(path: string, action: RouterImport, priority?: number) {
    return this.route('[A-Z]+', path, action, priority);
  }

  /**
   * Route for CONNECT method
   */
  public connect(path: string, action: RouterImport, priority?: number) {
    return this.route('CONNECT', path, action, priority);
  }

  /**
   * Route for DELETE method
   */
  public delete(path: string, action: RouterImport, priority?: number) {
    return this.route('DELETE', path, action, priority);
  }

  /**
   * Route for GET method
   */
  public get(path: string, action: RouterImport, priority?: number) {
    return this.route('GET', path, action, priority);
  }

  /**
   * Route for HEAD method
   */
  public head(path: string, action: RouterImport, priority?: number) {
    return this.route('HEAD', path, action, priority);
  }

  /**
   * Route for OPTIONS method
   */
  public options(path: string, action: RouterImport, priority?: number) {
    return this.route('OPTIONS', path, action, priority);
  }

  /**
   * Route for PATCH method
   */
  public patch(path: string, action: RouterImport, priority?: number) {
    return this.route('PATCH', path, action, priority);
  }

  /**
   * Route for POST method
   */
  public post(path: string, action: RouterImport, priority?: number) {
    return this.route('POST', path, action, priority);
  }

  /**
   * Route for PUT method
   */
  public put(path: string, action: RouterImport, priority?: number) {
    return this.route('PUT', path, action, priority);
  }

  /**
   * Route for TRACE method
   */
  public trace(path: string, action: RouterImport, priority?: number) {
    return this.route('TRACE', path, action, priority);
  }

  /**
   * Makes an import action
   */
  public make(entry: RouterImport) {
    const router = this._router;
    const path = this._getImportPath(entry);
    return async function ImportFile(req: Request<R, X>, res: Response<S>) {
      //import the action
      const imports = (await entry()) as { 
        default: RouterAction<R, S, X> 
      };
      //get the default export
      const action = imports.default;
      //if dont cache
      if (!router.cache && path.length) {
        //delete it from the require cache 
        //so it can be processed again
        delete require.cache[require.resolve(path)];
      }
      //run the action
      //NOTE: it's probably better 
      // to not strongly type this...
      return await action(req, res);
    }
  }

  /**
   * Adds a callback to the given event listener
   */
  public on(
    event: string|RegExp, 
    entry: RouterImport,
    priority = 0
  ) {
    //get all the router entries
    const entries = this._router.entries;
    //create a key for the entry
    const key = event.toString();
    //if the listener group does not exist, create it
    if (!entries.has(key)) {
      entries.set(key, new Set());
    }
    //get the import path
    const path = this._getImportPath(entry);
    //add the listener to the group
    entries.get(key)?.add({ entry: path, priority });
    //now listen for the event
    this._router.on(event, this.make(entry), priority);
    return this;
  }

  /**
   * Returns a route
   */
  public route(
    method: Method|'[A-Z]+', 
    path: string, 
    entry: RouterImport,
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
    this._router.routes.set(event.toString(), {
      method: method === '[A-Z]+' ? 'ALL' : method,
      path: path
    });
    //add to tasks
    return this.on(event, entry, priority);
  }

  /**
   * Parses the import path from the entry function
   */
  protected _getImportPath(entry: RouterImport) {
    const callback = entry.toString();
    //ex. callback = "() => import('foobar')"
    //ex. callback = "() => import(`foobar`)"
    //we need to extract foobar from the callback
    const matches = Array.from(
      callback.matchAll(/((import)|(require))\(\s*['"`](.+)['"`]\s*\)/g)
    )[0];
    return matches ? (Array.from(matches)[4] || ''): '';
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
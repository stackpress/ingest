//stackpress
import type { Method } from '@stackpress/lib/types';
//common
import type { EntryTask } from '../types';
import type Request from '../Request';
import type Response from '../Response';
//local
import type Router from '../Router';

export default class EntryRouter<
  //request resource
  R = unknown, 
  //response resource
  S = unknown, 
  //context (usually the server)
  X = unknown
>  {
  //A route map to task queues
  public readonly entries = new Map<string, Set<EntryTask>>();
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
  public make(action: string) {
    return async function EntryFileAction(
      req: Request<R, X>, 
      res: Response<S>
    ) {
      //import the action
      const imports = await import(action);
      //get the default export
      const callback = imports.default;
      //run the action
      //NOTE: it's probably better 
      // to not strongly type this...
      return await callback(req, res);
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
    //create a key for the entry
    const key = event.toString();
    //if the listener group does not exist, create it
    if (!this.entries.has(key)) {
      this.entries.set(key, new Set());
    }
    //add the listener to the group
    this.entries.get(key)?.add({ entry, priority });
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
};
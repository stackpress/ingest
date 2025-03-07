//stackpress
import type { Method } from '@stackpress/lib/dist/types';
//common
import type { 
  ImportTask,
  RouterAction,
  RouterImport
} from '../types';
import Request from '../Request';
import Response from '../Response';
//local
import type Router from '../Router';

export default class ImportRouter<
  //request resource
  R = unknown, 
  //response resource
  S = unknown, 
  //context (usually the server)
  X = unknown
>  {
  //A route map to task queues
  public readonly imports = new Map<string, Set<ImportTask>>();
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
  public make(action: RouterImport) {
    return async function ImportFileAction(
      req: Request<R, X>, 
      res: Response<S>
    ) {
      //import the action
      const imports = (await action()) as { 
        default: RouterAction<R, S, X> 
      };
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
  public on(event: string|RegExp, action: RouterImport, priority = 0) {
    //create a key for the entry
    const key = event.toString();
    //if the listener group does not exist, create it
    if (!this.imports.has(key)) {
      this.imports.set(key, new Set());
    }
    //add the listener to the group
    this.imports.get(key)?.add({ import: action, priority });
    //now listen for the event
    this._router.on(event, this.make(action), priority);
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
};
//stackpress
import type { Method } from '@stackpress/lib/types';
//common
import type { 
  ImportRouterAction,
  ImportRouterTaskItem,
  ActionRouterAction,
  ActionRouterListener
} from '../types';
import type Request from '../Request';
import type Response from '../Response';
//local
import type ActionRouter from './ActionRouter';

export default class ImportRouter<R, S, X>  {
  //A route map to task queues
  //event -> [ ...{ import, priority } ]
  public readonly imports = new Map<string, Set<ImportRouterTaskItem<R, S, X>>>();
  //parent router
  protected _router: ActionRouter<R, S, X>;
  //listener straight to the end
  protected _listen: ActionRouterListener<R, S, X>;

  /**
   * Sets the router
   */
  public constructor(
    router: ActionRouter<R, S, X>,
    listen: ActionRouterListener<R, S, X>
  ) {
    this._router = router;
    this._listen = listen;
  }

  /**
   * Makes an action given import action
   * Register the entry, a provision for builders
   */
  public action(
    event: string, 
    action: ImportRouterAction<R, S, X>, 
    priority = 0
  ) {
    //if the listener group does not exist, create it
    if (!this.imports.has(event)) {
      this.imports.set(event, new Set());
    }
    //add the listener to the group
    this.imports.get(event)?.add({ import: action, priority });
    return async function ImportFileAction(
      req: Request<R>, 
      res: Response<S>,
      ctx: X
    ) {
      //import the action
      const imports = await action() as { 
        default: ActionRouterAction<R, S, X> 
      };
      //get the default export
      const callback = imports.default;
      //run the action
      return await callback(req, res, ctx);
    }
  }

  /**
   * Route for any method
   */
  public all(
    path: string, 
    action: ImportRouterAction<R, S, X>, 
    priority?: number
  ) {
    return this.route('ALL', path, action, priority);
  }

  /**
   * Route for CONNECT method
   */
  public connect(
    path: string, 
    action: ImportRouterAction<R, S, X>, 
    priority?: number
  ) {
    return this.route('CONNECT', path, action, priority);
  }

  /**
   * Route for DELETE method
   */
  public delete(
    path: string, 
    action: ImportRouterAction<R, S, X>, 
    priority?: number
  ) {
    return this.route('DELETE', path, action, priority);
  }

  /**
   * Route for GET method
   */
  public get(
    path: string, 
    action: ImportRouterAction<R, S, X>, 
    priority?: number
  ) {
    return this.route('GET', path, action, priority);
  }

  /**
   * Route for HEAD method
   */
  public head(
    path: string, 
    action: ImportRouterAction<R, S, X>, 
    priority?: number
  ) {
    return this.route('HEAD', path, action, priority);
  }

  /**
   * Adds a callback to the given event listener
   */
  public on(
    event: string|RegExp, 
    entry: ImportRouterAction<R, S, X>,
    priority = 0
  ) {
    const key = this._router.eventName(event);
    const action = this.action(key, entry, priority);
    this._listen(key, action, priority);
    return this;
  }

  /**
   * Route for OPTIONS method
   */
  public options(
    path: string, 
    action: ImportRouterAction<R, S, X>, 
    priority?: number
  ) {
    return this.route('OPTIONS', path, action, priority);
  }

  /**
   * Route for PATCH method
   */
  public patch(
    path: string, 
    action: ImportRouterAction<R, S, X>, 
    priority?: number
  ) {
    return this.route('PATCH', path, action, priority);
  }

  /**
   * Route for POST method
   */
  public post(
    path: string, 
    action: ImportRouterAction<R, S, X>, 
    priority?: number
  ) {
    return this.route('POST', path, action, priority);
  }

  /**
   * Route for PUT method
   */
  public put(
    path: string, 
    action: ImportRouterAction<R, S, X>, 
    priority?: number
  ) {
    return this.route('PUT', path, action, priority);
  }

  /**
   * Returns a route
   */
  public route(
    method: Method, 
    path: string, 
    entry: ImportRouterAction<R, S, X>,
    priority = 0
  ) {
    const event = this._router.eventName(method, path);
    const action = this.action(event, entry, priority);
    this._listen(event, action, priority);
    return this;
  } 

  /**
   * Route for TRACE method
   */
  public trace(
    path: string, 
    action: ImportRouterAction<R, S, X>, 
    priority?: number
  ) {
    return this.route('TRACE', path, action, priority);
  }
  
  /**
   * Allows imports from other routers to apply here
   */
  public use(router: ImportRouter<R, S, X>) {
    //first concat their routes with this one
    //event -> [ ...{ import, priority } ]
    router.imports.forEach((tasks, event) => {
      //if the listener group does not exist
      if (!this.imports.has(event)) {
        //create the listener group
        this.imports.set(event, new Set());
      }
      //add all the tasks to the listener group
      //[ ...{ import, priority } ]
      //NOTE: possible duplicate tasks
      tasks.forEach(task => this.imports.get(event)?.add(task));
    });
    return this;
  }
};
//node
import type { 
  Method, 
  UnknownNest,
  TaskResult 
} from '@stackpress/lib/types';
//common
import type { 
  ViewRouterTaskItem,
  ActionRouterListener
} from '../types.js';
import type Request from '../Request.js';
import type Response from '../Response.js';
//local
import type ActionRouter from './ActionRouter.js';

export type ViewEngine<R, S, X> = (
  filePath: string, 
  req: Request<R>, 
  res: Response<S>,
  ctx: X
) => TaskResult;

export type ViewRender = (
  filePath: string, 
  props?: UnknownNest, 
  options?: UnknownNest
) => string|null|Promise<string|null>;

export default class ViewRouter<R, S, X> {
  //A route map to task queues
  //event -> [ ...{ entry, priority } ]
  public readonly views = new Map<string, Set<ViewRouterTaskItem>>();
  //engine
  protected _engine: ViewEngine<R, S, X> = () => void 0;
  //render
  protected _render: ViewRender = () => null;
  //parent router
  protected _router: ActionRouter<R, S, X>;
  //listener straight to the end
  protected _listen: ActionRouterListener<R, S, X>;

  /**
   * Get the view engine method
   */
  public get engine() {
    return this._engine;
  }

  /**
   * Set the view engine method
   */
  public set engine(engine: ViewEngine<R, S, X>) {
    this._engine = engine;
  }

  /**
   * Get the render method
   */
  public get render() {
    return this._render;
  }

  /**
   * Set the render method
   */
  public set render(render: ViewRender) {
    this._render = render;
  }

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
   * Makes an action from an entry pathname string
   * Register the entry, a provision for builders
   */
  public action(event: string, action: string, priority = 0) {
    //if the listener group does not exist, create it
    if (!this.views.has(event)) {
      this.views.set(event, new Set());
    }
    //add the listener to the group
    this.views.get(event)?.add({ entry: action, priority });
    const router = this;
    return async function TemplateFileAction(
      req: Request<R>, 
      res: Response<S>,
      ctx: X
    ) {
      if (!router._engine) return;
      await router._engine(action, req, res, ctx);
    }
  }

  /**
   * Route for any method
   */
  public all(
    path: string, 
    action: string, 
    priority?: number
  ) {
    return this.route('ALL', path, action, priority);
  }

  /**
   * Route for CONNECT method
   */
  public connect(
    path: string, 
    action: string, 
    priority?: number
  ) {
    return this.route('CONNECT', path, action, priority);
  }

  /**
   * Route for DELETE method
   */
  public delete(
    path: string, 
    action: string, 
    priority?: number
  ) {
    return this.route('DELETE', path, action, priority);
  }

  /**
   * Route for GET method
   */
  public get(
    path: string, 
    action: string, 
    priority?: number
  ) {
    return this.route('GET', path, action, priority);
  }

  /**
   * Route for HEAD method
   */
  public head(
    path: string, 
    action: string, 
    priority?: number
  ) {
    return this.route('HEAD', path, action, priority);
  }
    
  /**
   * Adds a callback to the given event listener
   */
  public on(
    event: string|RegExp, 
    entry: string,
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
    action: string, 
    priority?: number
  ) {
    return this.route('OPTIONS', path, action, priority);
  }

  /**
   * Route for PATCH method
   */
  public patch(
    path: string, 
    action: string, 
    priority?: number
  ) {
    return this.route('PATCH', path, action, priority);
  }

  /**
   * Route for POST method
   */
  public post(
    path: string, 
    action: string, 
    priority?: number
  ) {
    return this.route('POST', path, action, priority);
  }

  /**
   * Route for PUT method
   */
  public put(
    path: string, 
    action: string, 
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
    entry: string, 
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
    action: string, 
    priority?: number
  ) {
    return this.route('TRACE', path, action, priority);
  }
  
  /**
   * Allows views from other routers to apply here
   */
  public use(router: ViewRouter<R, S, X>) {
    //first concat their routes with this one
    //event -> [ ...{ entry, priority } ]
    router.views.forEach((tasks, event) => {
      //if the listener group does not exist
      if (!this.views.has(event)) {
        //create the listener group
        this.views.set(event, new Set());
      }
      //add all the tasks to the listener group
      //[ ...{ entry, priority } ]
      //NOTE: possible duplicate tasks
      tasks.forEach(task => this.views.get(event)?.add(task));
    });
    return this;
  }
};
//stackpress
import type { 
  Method,
  RequestOptions,
  ResponseOptions,
  StatusResponse
} from '@stackpress/lib/types';
import { isObject } from '@stackpress/lib/Nest';
//router
import type EntryRouter from './router/EntryRouter';
import type ImportRouter from './router/ImportRouter';
import type ViewRouter from './router/ViewRouter';
import ActionRouter from './router/ActionRouter';
//local
import type { 
  AnyRouterAction, 
  ActionRouterAction, 
  ImportRouterAction 
} from './types';
import Request from './Request';
import Response from './Response';
export default class Router<
  //request resource
  R = unknown, 
  //response resource
  S = unknown
> {
  //action router main
  public readonly action: ActionRouter<R, S, this>;
  //entry router extension
  public readonly entry: EntryRouter<R, S, this>;
  //import router extension
  public readonly import: ImportRouter<R, S, this>;
  //view router extension
  public readonly view: ViewRouter<R, S, this>;

  /**
   * Returns the router entry map
   */
  public get entries() {
    return this.entry.entries;
  }

  /**
   * Returns the router import map
   */
  public get imports() {
    return this.import.imports;
  }

  /**
   * Returns the event listener map
   */
  public get listeners(): typeof this.action.listeners {
    return this.action.listeners;
  }

  /**
   * Returns the router route map
   */
  public get routes() {
    return this.action.routes;
  }

  /**
   * Returns the router view map
   */
  public get views() {
    return this.view.views;
  }

  /**
   * Sets the main router and its extensions
   */
  public constructor() {
    this.action = new ActionRouter<R, S, this>(this);
    this.entry = this.action.entry;
    this.import = this.action.import;
    this.view = this.action.view;
  }

  /**
   * Route for any method
   */
  public all(
    path: string, 
    action: AnyRouterAction<R, S, this>, 
    priority?: number
  ) {
    return this.route('ALL', path, action, priority);
  }

  /**
   * Route for CONNECT method
   */
  public connect(
    path: string, 
    action: AnyRouterAction<R, S, this>, 
    priority?: number
  ) {
    return this.route('CONNECT', path, action, priority);
  }

  /**
   * Route for DELETE method
   */
  public delete(
    path: string, 
    action: AnyRouterAction<R, S, this>, 
    priority?: number
  ) {
    return this.route('DELETE', path, action, priority);
  }

  /**
   * Calls all the callbacks of the given event passing the given arguments
   */
  public async emit(event: string, req: Request<R>, res: Response<S>) {
    return this.action.emit(event, req, res);
  }

  /**
   * Route for GET method
   */
  public get(
    path: string, 
    action: AnyRouterAction<R, S, this>, 
    priority?: number
  ) {
    return this.route('GET', path, action, priority);
  }

  /**
   * Route for HEAD method
   */
  public head(
    path: string, 
    action: AnyRouterAction<R, S, this>, 
    priority?: number
  ) {
    return this.route('HEAD', path, action, priority);
  }
  
  /**
   * Adds a callback to the given event listener
   */
  public on(
    event: string|RegExp, 
    action: AnyRouterAction<R, S, this>,
    priority = 0
  ) {
    //delegate to appropriate router based on action type
    //if action is a string, it is a view router action
    if (typeof action === 'string') {
      //view router for string paths
      this.view.on(
        event, 
        action as string, 
        priority
      );
    //if action is a function with no 
    //parameter, it is an entry router action
    } else if (typeof action === 'function' 
      && action.length === 0
      && !action
    ) {
      //import router for parameterless functions
      this.import.on(
        event, 
        action as ImportRouterAction<R, S, this>,
        priority
      );
    //if action is a function with more than 0 
    //parameters, it is an action router action 
    } else {
      this.action.on(
        event, 
        action as ActionRouterAction<R, S, this>,
        priority
      );
    }
    return this;
  }
  
  /**
   * Route for OPTIONS method
   */
  public options(
    path: string, 
    action: AnyRouterAction<R, S, this>, 
    priority?: number
  ) {
    return this.route('OPTIONS', path, action, priority);
  }

  /**
   * Route for PATCH method
   */
  public patch(
    path: string, 
    action: AnyRouterAction<R, S, this>, 
    priority?: number
  ) {
    return this.route('PATCH', path, action, priority);
  }

  /**
   * Route for POST method
   */
  public post(
    path: string, 
    action: AnyRouterAction<R, S, this>, 
    priority?: number
  ) {
    return this.route('POST', path, action, priority);
  }

  /**
   * Route for PUT method
   */
  public put(
    path: string, 
    action: AnyRouterAction<R, S, this>, 
    priority?: number
  ) {
    return this.route('PUT', path, action, priority);
  }
  
  /**
   * Creates a new request
   */
  public request(init: Partial<RequestOptions<R>> = {}) {
    return new Request<R>(init);
  }

  /**
   * Emits an event and returns the response
   */
  public async resolve<T = unknown>(
    event: string, 
    request?: Request<R> | Record<string, any>, 
    response?: Response<S>
  ): Promise<Partial<StatusResponse<T>>>;
  
  /**
   * Routes to another route and returns the response
   */
  public async resolve<T = unknown>(
    method: Method | '*', 
    path: string, 
    request?: Request<R> | Record<string, any>, 
    response?: Response<S>
  ): Promise<Partial<StatusResponse<T>>>;
  
  /**
   * Emits an event and returns the response, or
   * Routes to another route and returns the response
   */
  public async resolve<T = unknown>(
    methodPath: string, 
    pathRequest?: string | Request<R> | Record<string, any>, 
    requestResponse?: Request<R> | Record<string, any> | Response<S>, 
    response?: Response<S>
  ) {
    //if 2nd argument is a string
    if (typeof pathRequest === 'string') {
      //then this is route related
      return this._resolveRoute<T>(
        methodPath, 
        pathRequest, 
        requestResponse, 
        response
      );
    }
    //otherwise this is event related
    return this._resolveEvent<T>(
      methodPath, 
      pathRequest, 
      requestResponse as Response<S>
    );
  }

  /**
   * Creates a new response
   */
  public response(init: Partial<ResponseOptions<S>> = {}) {
    return new Response<S>(init);
  }

  /**
   * Returns a route
   */
  public route(
    method: Method, 
    path: string, 
    action: AnyRouterAction<R, S, this>, 
    priority = 0
  ) {
    //delegate to appropriate router based on action type
    //if action is a string, it is a view router action
    if (typeof action === 'string') {
      //view router for string paths
      this.view.route(
        method,
        path, 
        action as string, 
        priority
      );
    //if action is a function with no 
    //parameter, it is an entry router action
    } else if (typeof action === 'function' 
      && action.length === 0
      && !action
    ) {
      //import router for parameterless functions
      this.import.route(
        method,
        path, 
        action as ImportRouterAction<R, S, this>,
        priority
      );
    //if action is a function with more than 0 
    //parameters, it is an action router action 
    } else {
      this.action.route(
        method,
        path, 
        action as ActionRouterAction<R, S, this>,
        priority
      );
    }
    return this;
  }
  
  /**
   * Route for TRACE method
   */
  public trace(
    path: string, 
    action: AnyRouterAction<R, S, this>, 
    priority?: number
  ) {
    return this.route('TRACE', path, action, priority);
  }

  /**
   * Allows routes from other routers to apply here
   */
  public use<T extends Router<R, S>>(router: T) {
    //Patch: Router<R, S> is assignable to the constraint of type  
    //this, but this could be instantiated with a different subtype  
    //of constraint Router<R, S>
    const thisRouter = router as unknown as this;
    this.action.use(thisRouter.action);
    this.entry.use(thisRouter.entry);
    this.import.use(thisRouter.import);
    this.view.use(thisRouter.view);
    return this;
  }
  
  /**
   * Emits an event and returns the response
   * (helper for resolve)
   */
  protected async _resolveEvent<T = unknown>(
    event: string, 
    request?: Request<R> | Record<string, any>, 
    response?: Response<S>
  ) {
    if (!request) {
      request = this.request();
    } else if (isObject(request)) {
      const data = request as Record<string, any>;
      request = this.request({ data });
    }
    const req = request as Request<R>;
    const res = response || this.response();
    await this.emit(event, req, res);  
    return res.toStatusResponse<T>();
  }

  /**
   * Routes to another route and returns the response
   * (helper for resolve)
   */
  protected async _resolveRoute<T = unknown>(
    method: string, 
    path: string, 
    request?: Request<R>|Record<string, any>,
    response?: Response<S>
  ) {
    const event = `${method.toUpperCase()} ${path}`;
    return await this._resolveEvent<T>(event, request, response);  
  }
}
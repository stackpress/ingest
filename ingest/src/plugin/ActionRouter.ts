//stackpress
import type { 
  Route,
  Method,
  EventMatch, 
  TaskItem 
} from '@stackpress/lib/types';
import type EventEmitter from '@stackpress/lib/EventEmitter';
import ExpressEmitter from '@stackpress/lib/ExpressEmitter';
import Status from '@stackpress/lib/Status';
//common
import type {
  ActionRouterArgs,
  ActionRouterMap,
  ActionRouterAction
} from '../types.js';
import type Request from '../Request.js'; 
import type Response from '../Response.js';
//local
import EntryRouter from './EntryRouter.js';
import ImportRouter from './ImportRouter.js';
import ViewRouter from './ViewRouter.js';

/**
 * Event driven routing system. Bring 
 * your own request and response types.
 */
export default class ActionRouter<R, S, X>
  extends ExpressEmitter<ActionRouterMap<R, S, X>> 
{
  //context to pass to the actions
  public readonly context: X;
  //map of event names to routes 
  //event -> { method, path }
  public readonly routes = new Map<string, Route>();
  //entry router extension
  public readonly entry: EntryRouter<R, S, X>;
  //import router extension
  public readonly import: ImportRouter<R, S, X>;
  //view router extension
  public readonly view: ViewRouter<R, S, X>;

  /**
   * Sets the pattern separator
   */
  public constructor(context: X) {
    super('/');
    this.context = context;
    const listen = this._listen.bind(this);
    this.entry = new EntryRouter<R, S, X>(this, listen);
    this.import = new ImportRouter<R, S, X>(this, listen);
    this.view = new ViewRouter<R, S, X>(this, listen);
  }

  /**
   * Calls all the callbacks of the given event passing the given arguments
   */
  public async emit(
    event: string, 
    req: Request<R>, 
    res: Response<S>
  ) {
    const queue = this.tasks(event);
    
    //if there are no events found
    if (queue.size === 0) {
      //report a 404
      return Status.NOT_FOUND;
    }

    return await queue.run(req, res, this.context);
  }

  /**
   * Determines the event name given a method and path
   * This also sets the route in the routes map. 
   * This also sets the expression in the expressions map.
   */
  public eventName(event: string|RegExp): string;
  public eventName(method: Method, path: string): string;
  public eventName(method: string|RegExp, path?: string) {
    //if no path
    if (method instanceof RegExp || !path) {
      //use the  the event name
      return this._eventName(method);
    }
    return this._eventNameFromRoute(method, path);
  }
  
  /**
   * Returns a route
   */
  public route(
    method: Method, 
    path: string, 
    action: ActionRouterAction<R, S, X>, 
    priority = 0
  ) {
    const event = this._eventNameFromRoute(method, path);
    const results = this._listen(event, action, priority);
    return { method, path, ...results };
  }

  /**
   * Allows events from other emitters to apply here
   */
  public use(emitter: EventEmitter<ActionRouterMap<R, S, X>>) {
    //check if the emitter is a router
    if (emitter instanceof ActionRouter) {
      //first concat their routes with this one
      emitter.routes.forEach(
        (route, event) => this.routes.set(event, route)
      );
    }
    //next merge the expressions
    //next merge the listeners
    super.use(emitter);
    return this;
  }

  /**
   * Determines the event name given a method and path
   * This also sets the route in the routes map. 
   */
  protected _eventNameFromRoute(method: string, path: string) {
    //make sure the method is uppercase
    method = method.toUpperCase();
    //make regexp fragment from path
    const fragment = this._toFragment(path);
    //if any method
    if (method === 'ALL') {
      //determine pattern
      const pattern = fragment !== path ? path: '';
      //complete the expression
      const expression = `^[A-Z]+ ${fragment}${this.separator}*$`;
      //listen to expression
      const event = this._eventNameFromExpression(expression, pattern);
      //set the route (pattern should be in expressions ?)
      this.routes.set(event, { method, path });
      return event;
    }
    //determine the event key
    let event = `${method} ${path}`;
    //if the pattern is different
    if (fragment !== path) {
      //complete the expression
      const expression = `^${method} ${fragment}${this.separator}*$`;
      //listen to expression
      event = this._eventNameFromExpression(expression, event);
      //set the route (pattern should be in expressions ?)
      this.routes.set(event, { method, path });
      return event;
    }
    //set the route (pattern should be in expressions ?)
    this.routes.set(event, { method, path });
    return event;
  }
  
  /**
   * Returns a task for the given event and task
   */
  protected _task(
    match: EventMatch, 
    task: TaskItem<ActionRouterArgs<R, S, X>>
  ) {
    return async (
      req: Request<R>, 
      res: Response<S>, 
      ctx: X
    ) => {
      //set the current
      this._event = { 
        ...match, 
        ...task, 
        args: [ req, res, ctx ], 
        action: task.item 
      };
      //add the params to the request data
      req.data.set(match.data.params);
      //are there any args?
      if (match.data.args.length) {
        //add the args to the request data
        req.data.set(match.data.args);
      }
      //before hook
      if (typeof this._before === 'function' 
        && await this._before(this._event) === false
      ) {
        return false;
      }
      //if this is the same event, call the 
      //method, if the method returns false
      if (await task.item(req, res, ctx) === false) {
        return false;
      }
      //after hook
      if (typeof this._after === 'function' 
        && await this._after(this._event) === false
      ) {
        return false;
      }
    };
  }
};
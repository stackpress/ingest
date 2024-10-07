//framework
import type { 
  Listener, 
  Listenable, 
  Method, 
  RouteInfo, 
  EventData, 
  RouteData
} from './types';
import Event from './Event';
import Emitter from './Emitter';
import Route from './Route';
import Status from './Status';

/**
 * An abstract class, the router combines the functionality of listening,
 * emitting and routing events. The abstract that needs to be defined is 
 * the emitter that will be used. The generics needed are the following.
 * 
 * - A - Action. Examples of an action could be a callback function or a 
 *   file location of an action callback.
 * - R - Request. The request object. Examples of a request could be 
 *   IncomingMessage, Fetch Request or the built-in `Request` defined
 *   in the `payload` folder. Though most of the time it should be the 
 *   built-in `Request` defined in the `payload` folder, we left this 
 *   generic to allow the `gateway` folder to re-use this class for 
 *   IncomingMessage.
 * - S - Response. The response object. Examples of a response could be 
 *   ServerResponse, Fetch Response or the built-in `Response` defined
 *   in the `payload` folder. Though most of the time it should be the 
 *   built-in `Response` defined in the `payload` folder, we left this 
 *   generic to allow the `gateway` folder to re-use this class for 
 *   ServerResponse.
 */
export default abstract class Router<A, R, S> {
  //A route map to task queues
  public readonly listeners = new Map<string, Set<Listener<A>>>();
  //Event regular expression map
  public readonly regexp = new Set<string>();
  //map of event names to routes 
  //^${method}\\s${pattern}/*$ -> { method, path }
  public readonly routes = new Map<string, RouteInfo>;

  /**
   * Route for any method
   */
  public all(path: string, action: A, priority?: number) {
    return this.route('[A-Z]+', path, action, priority);
  }

  /**
   * Route for CONNECT method
   */
  public connect(path: string, action: A, priority?: number) {
    return this.route('CONNECT', path, action, priority);
  }

  /**
   * Route for DELETE method
   */
  public delete(path: string, action: A, priority?: number) {
    return this.route('DELETE', path, action, priority);
  }

  /**
   * Calls all the actions of the given 
   * event passing the given arguments
   */
  public async emit(event: string, req: R, res: S, cache = true) {
    const matches = this.match(event, req);

    //if there are no events found
    if (!Object.keys(matches).length) {
      //report a 404
      return Status.NOT_FOUND;
    }

    const emitter = this.makeEmitter();

    Object.values(matches).forEach(event => {
      const name = event.pattern?.toString() || event.name;
      //if no direct observers
      if (!this.listeners.has(name)) {
        return;
      }

      //then loop the observers
      const listeners = this.listeners.get(name) as Set<Listener<A>>;
      listeners.forEach(route => {
        emitter.add(event, route.action, route.priority);
      });
    });

    //call the callbacks
    return await emitter.emit(req, res, undefined, cache);
  }

  /**
   * Route for GET method
   */
  public get(path: string, action: A, priority?: number) {
    return this.route('GET', path, action, priority);
  }

  /**
   * Route for HEAD method
   */
  public head(path: string, action: A, priority?: number) {
    return this.route('HEAD', path, action, priority);
  }

  /**
   * Returns a new emitter instance
   */
  public abstract makeEmitter(): Emitter<A, R, S>;

  /**
   * Returns a new event instance
   */
  public makeEvent(req: R, data: EventData) {
    return new Event<A, R, S>(this, req, data);
  };

  /**
   * Returns a new route instance
   */
  public makeRoute(req: R, data: RouteData) {
    return new Route<A, R, S>(this, req, data);
  }

  /**
   * Returns possible event matches
   */
  public match(trigger: string, req: R) {
    const matches: Record<string, Event<A, R, S>> = {};
    //first do the obvious match
    if (this.listeners.has(trigger)) {
      matches[trigger] = this.makeEvent(req, { event: trigger, trigger });
    }

    //next do the calculated matches
    this.regexp.forEach(pattern => {
      const regexp = new RegExp(
        // pattern,
        pattern.substring(
          pattern.indexOf('/') + 1,
          pattern.lastIndexOf('/')
        ),
        // flag
        pattern.substring(
          pattern.lastIndexOf('/') + 1
        )
      );

      //because String.matchAll only works for global flags ...
      let match, parameters: string[];
      if (regexp.flags.indexOf('g') === -1) {
        match = trigger.match(regexp);
        if (!match || !match.length) {
          return;
        }

        parameters = [];
        if (Array.isArray(match)) {
          parameters = match.slice();
          parameters.shift();
        }
      } else {
        match = Array.from(trigger.matchAll(regexp));
        if (!Array.isArray(match[0]) || !match[0].length) {
          return;
        }

        parameters = match[0].slice();
        parameters.shift();
      }

      //okay here's a doozy...
      //So event is the string that will be used to compare
      //against the trigger. The trigger is the string provided
      //when emit() is called. The event can be a name string or 
      //a string regexp pattern. If it's a regexp pattern, then 
      //it will be logged in the regexp registry set. All routes
      //are regexps, but not all regexps are routes. Routes are
      //defined by the route() method and are stored in the routes
      //registry map. This means the key of the route is always in
      //the regexp registry set
      const route = this.routes.get(pattern);
      if (route) {
        matches[pattern] = this.makeRoute(req, {
          method: route.method,
          path: route.path,
          event: pattern,
          pattern: regexp,
          trigger
        });
      } else {
        matches[pattern] = this.makeEvent(req, {
          event: pattern,
          pattern: regexp,
          trigger
        });
      }
    });

    return matches;
  }

  /**
   * Adds a callback to the given event route
   */
  public on(event: Listenable, action: A, priority: number = 0) {
    //deal with multiple events
    if (Array.isArray(event)) {
      event.forEach(event => this.on(event, action, priority));
      return this;
    }

    //if it is a regexp object
    if (event instanceof RegExp) {
      //make it into a string
      event = event.toString()
      //go ahead and add the pattern
      //set guarantees uniqueness
      this.regexp.add(event);
    }

    //add the event to the listeners
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set<Listener<A>>());
    }

    const listeners = this.listeners.get(event) as Set<Listener<A>>;
    listeners.add({ action, priority })
    return this
  }

  /**
   * Route for OPTIONS method
   */
  public options(path: string, action: A, priority?: number) {
    return this.route('OPTIONS', path, action, priority);
  }

  /**
   * Route for PATCH method
   */
  public patch(path: string, action: A, priority?: number) {
    return this.route('PATCH', path, action, priority);
  }

  /**
   * Route for POST method
   */
  public post(path: string, action: A, priority?: number) {
    return this.route('POST', path, action, priority);
  }

  /**
   * Route for PUT method
   */
  public put(path: string, action: A, priority?: number) {
    return this.route('PUT', path, action, priority);
  }

  /**
   * Returns a route
   */
  public route(
    method: Method|'[A-Z]+', 
    path: string, 
    action: A, 
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
    this.on(event, action, priority);
    return this;
  }

  /**
   * Route for TRACE method
   */
  public trace(path: string, action: A, priority?: number) {
    return this.route('TRACE', path, action, priority);
  }

  /**
   * Stops listening to an event
   */
  public unbind(event?: string, action?: A) {
    //if there is no event and not callable
    if (!event && !action) {
      //it means that they want to remove everything
      for (let key in this.listeners) {
        this.listeners.delete(key);
      }
    //if there is an event and no entry
    } else if (event && !action) {
      //remove all entries under this event
      this.listeners.delete(event);
    //if there is an event and an entry
    } else if (event && action) {
      //remove the specific entry from the event
      const tasks = this.listeners.get(event);
      if (tasks) {
        tasks.forEach(task => {
          if(action === task.action) {
            tasks.delete(task);
          }
        });
      }
    //if there is no event and an entry
    } else if (!event && action) {
      //remove the specific entry from all events
      for (const event in this.listeners) {
        const tasks = this.listeners.get(event);
        if (tasks) {
          tasks.forEach(task => {
            if(action === task.action) {
              tasks.delete(task);
            }
          });
        }
      }
    }

    return this;
  }
};

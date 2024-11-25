//stackpress
import type { Method, Route } from '@stackpress/types/dist/types';
//local
import type { ManifestOptions } from './types';
import Emitter from './Emitter';
import Manifest from './Manifest';

/**
 * Event driven routing system. Allows the ability to listen to 
 * events made known by another piece of functionality. Events are 
 * items that transpire based on an action. With events you can add 
 * extra functionality right after the event has triggered.
 */
export default class Router extends Emitter {
  //map of event names to routes 
  //^${method}\\s${pattern}/*$ -> { method, path }
  public readonly routes = new Map<string, Route>;

  /**
   * Route for any method
   */
  public all(path: string, entry: string, priority?: number) {
    return this.route('[A-Z]+', path, entry, priority);
  }

  /**
   * Route for CONNECT method
   */
  public connect(path: string, entry: string, priority?: number) {
    return this.route('CONNECT', path, entry, priority);
  }

  /**
   * Route for DELETE method
   */
  public delete(path: string, entry: string, priority?: number) {
    return this.route('DELETE', path, entry, priority);
  }

  /**
   * Route for GET method
   */
  public get(path: string, entry: string, priority?: number) {
    return this.route('GET', path, entry, priority);
  }

  /**
   * Route for HEAD method
   */
  public head(path: string, entry: string, priority?: number) {
    return this.route('HEAD', path, entry, priority);
  }

  /**
   * Generates a manifest of all the 
   * entry points and its meta data
   */
  public manifest(options: ManifestOptions = {}) {
    const manifest = new Manifest(this, options);
    this.listeners.forEach((tasks, event) => {
      //{ method, route }
      const uri = this.routes.get(event);
      const type = uri ? 'endpoint' : 'function';
      const route = uri ? uri.path : event;
      const pattern = this.emitter.regexp.has(event) ? new RegExp(
        // pattern,
        event.substring(
          event.indexOf('/') + 1,
          event.lastIndexOf('/') - 1
        ),
        // flag
        event.substring(
          event.lastIndexOf('/') + 1
        )
      ): undefined;
      const method = uri ? uri.method : 'ALL';
      manifest.add({ type, event, route, pattern, method, tasks });
    });
    return manifest;
  }

  /**
   * Route for OPTIONS method
   */
  public options(path: string, entry: string, priority?: number) {
    return this.route('OPTIONS', path, entry, priority);
  }

  /**
   * Route for PATCH method
   */
  public patch(path: string, entry: string, priority?: number) {
    return this.route('PATCH', path, entry, priority);
  }

  /**
   * Route for POST method
   */
  public post(path: string, entry: string, priority?: number) {
    return this.route('POST', path, entry, priority);
  }

  /**
   * Route for PUT method
   */
  public put(path: string, entry: string, priority?: number) {
    return this.route('PUT', path, entry, priority);
  }

  /**
   * Returns a route
   */
  public route(
    method: Method|'[A-Z]+', 
    path: string, 
    entry: string, 
    priority = 0
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
    //if the listener group does not exist, create it
    if (!this.listeners.has(pattern)) {
      this.listeners.set(pattern, new Set());
    }
    //add the listener to the group
    this.listeners.get(pattern)?.add({ entry, priority });
    //add the event to the emitter
    this.emitter.on(event, async (req, res) => {
      const imports = await import(entry);
      const action = imports.default;
      //delete it from the require cache so it can be processed again
      delete require.cache[require.resolve(entry)];
      //get context
      const context = req.fromRoute(path);
      //now call the action
      return await action(context, res);
    }, priority);

    return this;
  }

  /**
   * Route for TRACE method
   */
  public trace(path: string, action: string, priority?: number) {
    return this.route('TRACE', path, action, priority);
  }
};
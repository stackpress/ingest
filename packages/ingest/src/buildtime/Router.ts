import type { BuildOptions } from './types';
import EventEmitter from './EventEmitter';
import Manifest from './Manifest';

/**
 * Allows requests to be routed to a callback to be processed
 */
export default class Router extends EventEmitter {
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
   * Route for HEAD method
   */
  public head(path: string, entry: string, priority?: number) {
    return this.route('HEAD', path, entry, priority);
  }

  /**
   * Route for GET method
   */
  public get(path: string, entry: string, priority?: number) {
    return this.route('GET', path, entry, priority);
  }

  /**
   * Generates a manifest of all the 
   * entry points and its meta data
   */
  public manifest(options: BuildOptions = {}) {
    const manifest = new Manifest(this, options);
    this.listeners.forEach((listeners, event) => {
      //{ method, route }
      const uri = this.routes.get(event);
      const type = uri ? 'endpoint' : 'function';
      const route = uri ? uri.path : event;
      const pattern = this.regexp.has(event) ? new RegExp(
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
      manifest.add({ type, event, route, pattern, method, listeners });
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
   * Route for TRACE method
   */
  public trace(path: string, entry: string, priority?: number) {
    return this.route('TRACE', path, entry, priority);
  }
}
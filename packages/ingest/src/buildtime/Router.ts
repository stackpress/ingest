import type { URI, BuildOptions } from './types';

import EventRegistry from './EventRegistry';
import Route from './Route';
import Manifest from './Manifest';

/**
 * Allows requests to be routed to a callback to be processed
 */
export default class Router extends EventRegistry {
  //map of event names to routes 
  public readonly routes = new Map<string, URI>;

  /**
   * Route for any method
   */
  public all(path: string, entry: string, priority?: number) {
    this.route(path).all(entry, priority);
    return this;
  }

  /**
   * Route for CONNECT method
   */
  public connect(path: string, entry: string, priority?: number) {
    this.route(path).connect(entry, priority);
    return this;
  }

  /**
   * Route for DELETE method
   */
  public delete(path: string, entry: string, priority?: number) {
    this.route(path).delete(entry, priority);
    return this;
  }

  /**
   * Route for HEAD method
   */
  public head(path: string, entry: string, priority?: number) {
    this.route(path).head(entry, priority);
    return this;
  }

  /**
   * Route for GET method
   */
  public get(path: string, entry: string, priority?: number) {
    this.route(path).get(entry, priority);
    return this;
  }

  /**
   * Generates a manifest of all the 
   * entry points and its meta data
   */
  public manifest(options: BuildOptions = {}) {
    const manifest = new Manifest(options);
    this.listeners.forEach((tasks, event) => {
      //{ method, route }
      const uri = this.routes.get(event);
      const type = uri ? 'endpoint' : 'function';
      const route = uri ? uri.route : event;
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
      manifest.add({ type, event, route, pattern, method, tasks });
    });
    return manifest;
  }

  /**
   * Route for OPTIONS method
   */
  public options(path: string, entry: string, priority?: number) {
    this.route(path).options(entry, priority);
    return this;
  }

  /**
   * Route for PATCH method
   */
  public patch(path: string, entry: string, priority?: number) {
    this.route(path).patch(entry, priority);
    return this;
  }

  /**
   * Route for POST method
   */
  public post(path: string, entry: string, priority?: number) {
    this.route(path).post(entry, priority);
    return this;
  }

  /**
   * Route for PUT method
   */
  public put(path: string, entry: string, priority?: number) {
    this.route(path).put(entry, priority);
    return this;
  }

  /**
   * Returns a route
   */
  public route(event: string) {
    return new Route(event, this);
  }

  /**
   * Route for TRACE method
   */
  public trace(path: string, entry: string, priority?: number) {
    this.route(path).trace(entry, priority);
    return this;
  }
}
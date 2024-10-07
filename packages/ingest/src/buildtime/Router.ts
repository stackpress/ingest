//framework
import type { ActionFile, RouteData } from '../framework/types';
import EventRouter from '../framework/Router';
//payload
import type Request from '../payload/Request';
import type Response from '../payload/Response';
//buildtime
import type { BuildOptions } from './types';
import Emitter from './Emitter';
import Manifest from './Manifest';
import Event from './Event';
import Route from './Route';

/**
 * Allows the ability to listen to events made known by another
 * piece of functionality. Events are items that transpire based
 * on an action. With events you can add extra functionality
 * right after the event has triggered.
 */
export default class Router 
  extends EventRouter<ActionFile, Request, Response> 
{
  /**
   * Returns a new emitter instance
   */
  public makeEmitter() {
    return new Emitter();
  }
  
  /**
   * Returns a new event instance
   */
  public makeEvent(req: Request, data: RouteData) {
    return new Event(this, req, data);
  }
  
  /**
   * Returns a new route instance
   */
  public makeRoute(req: Request, data: RouteData) {
    return new Route(this, req, data);
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
};

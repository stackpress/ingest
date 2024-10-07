//framework
import type { ActionPayloadCallback, RouteData } from '../framework/types';
import EventRouter from '../framework/Router';
//payload
import type Request from '../payload/Request';
import type Response from '../payload/Response';
//runtime
import Emitter from './Emitter';
import Route from './Route';
import Event from './Event';

/**
 * Allows the ability to listen to events made known by another
 * piece of functionality. Events are items that transpire based
 * on an action. With events you can add extra functionality
 * right after the event has triggered.
 */
export default class Router 
  extends EventRouter<ActionPayloadCallback, Request, Response> 
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
};

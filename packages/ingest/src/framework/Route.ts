//framework
import type { Method, RouteData } from './types';
import type Router from './Router';
import Event from './Event';

/**
 * An object that is a kind of `Event` gets passed to an action callback. 
 * Generically, all actions that match an event trigger will pass the 
 * same request and response objects. The route object is meta data that 
 * compares what route was triggered and what the route pattern is. For 
 * example.
 * 
 * `/foo/:bar/zoo` and `/foo/bar/zoo` will be triggered by` /foo/bar/zoo` 
 * and share the same request and response, but the event object will 
 * have different patterns. In this case we can use the event object to 
 * extract the `:bar` from `/foo/:bar/zoo`, but we cant do that with 
 * `/foo/bar/zoo` listener.
 * 
 * The generics needed are the following.
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
export default class Route<A, R, S> extends Event<A, R, S> {
  //route method
  public readonly method: Method;
  //route path
  public readonly path: string;
  //The type of event
  public readonly type: string = 'route';

  /**
   * Sets the route info and the emitter context
   */
  constructor(emitter: Router<A, R, S>, req: R, info: RouteData) {
    super(emitter, req, info);
    this.method = info.method;
    this.path = info.path;
  }
}
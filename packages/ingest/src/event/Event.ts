import type { Method, EventType, EventInfo } from './types';
import type Request from '../payload/Request';
import type EventEmitter from './EventEmitter';

import { routeParams } from '../helpers';

export default class Event<A> {
  //The router instance
  public readonly emitter: EventEmitter<A>;
  //The request instance
  public readonly req: Request;
  //event or route
  public readonly type: EventType;
  //The name of the event
  public readonly name: string;
  //The event regular expression
  public readonly pattern: RegExp|undefined;
  //What triggered the event
  public readonly trigger: string;
  //route info if route
  public readonly method: Method;
  public readonly route: string;
  

  /**
   * Returns the matches of the regexp
   */
  public get matches() {
    if (this.pattern) {
      if (this.pattern.flags.indexOf('g') === -1) {
        const match = this.name.match(this.pattern);
        if (match && Array.isArray(match) && match.length) {
          const parameters = match.slice();
          parameters.shift();
          return parameters;
        }
      } else {
        const match = Array.from(this.name.matchAll(this.pattern));
        if (Array.isArray(match[0]) && !match[0].length) {
          const parameters = match[0].slice();
          parameters.shift();
          return parameters;
        }
      }
    }
    return [];
  }

  /**
   * Returns the route params
   */
  public get params() {
    return routeParams(
      this.route, 
      this.req.url.pathname
    );
  }

  /**
   * Returns data in staging
   */
  public get stage() {
    return Object.assign({}, 
      this.req.query.get(), 
      this.params.params,
      this.req.post.get()
    );
  }

  /**
   * Sets the route info and the emitter context
   */
  constructor(
    emitter: EventEmitter<A>,
    req: Request,
    info: EventInfo
  ) {
    this.emitter = emitter;
    this.req = req;
    this.type = info.type;
    this.name = info.event;
    this.pattern = info.pattern;
    this.trigger = info.trigger;
    this.method = info.method;
    this.route = info.route;
  }
}
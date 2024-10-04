import type Request from '../payload/Request';
import type EventEmitter from './EventEmitter';

import { routeParams } from '../helpers';

export default class Event<A> {
  //The name of the event
  public readonly name: string;
  //The event regular expression
  public readonly regexp: RegExp|undefined;
  //The router instance
  public readonly emitter: EventEmitter<A>;
  //The request instance
  public readonly req: Request;

  /**
   * Returns the matches of the regexp
   */
  public get matches() {
    if (this.regexp) {
      if (this.regexp.flags.indexOf('g') === -1) {
        const match = this.name.match(this.regexp);
        if (match && Array.isArray(match) && match.length) {
          const parameters = match.slice();
          parameters.shift();
          return parameters;
        }
      } else {
        const match = Array.from(this.name.matchAll(this.regexp));
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
      this.name, 
      this.req.url.pathname
    );
  }

  /**
   * Sets the route info and the emitter context
   */
  constructor(
    emitter: EventEmitter<A>,
    req: Request,
    name: string, 
    regexp?: RegExp
  ) {
    this.name = name;
    this.regexp = regexp;
    this.emitter = emitter;
    this.req = req;
  }
}
import type { EventData } from './types';
import type Request from '../payload/Request';
import type EventEmitter from './Router';

export default class Event<A> {
  //The router instance
  public readonly emitter: EventEmitter<A>;
  //The request instance
  public readonly req: Request;
  //The name of the event
  public readonly name: string;
  //The event regular expression
  public readonly pattern: RegExp|undefined;
  //What triggered the event
  public readonly trigger: string;
  //The type of event
  public readonly type: string = 'event';
  
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
   * Sets the route info and the emitter context
   */
  constructor(
    emitter: EventEmitter<A>,
    req: Request,
    info: EventData
  ) {
    this.emitter = emitter;
    this.req = req;
    this.name = info.event;
    this.pattern = info.pattern;
    this.trigger = info.trigger;
  }
}
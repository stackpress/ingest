//framework
import type { EventData } from './types';
import type EventEmitter from './Router';

/**
 * An object that gets passed to an action callback. Generically, all 
 * actions that match an event trigger will pass the same request and
 * response objects. The event object is meta data that compares what 
 * event was triggered and what the event pattern is. For example.
 * 
 * `an_event` and `an_([a-z]+)` will be triggered by `an_event` and
 * share the same request and response, but the event object will have
 * different patterns. In this case we can use the event object to 
 * extract the `event` from `an_([a-z]+)`, but we cant do that with 
 * the `an_event` listener.
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
export default class Event<A, R, S> {
  //The router instance
  public readonly emitter: EventEmitter<A, R, S>;
  //The request instance
  public readonly req: R;
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
    emitter: EventEmitter<A, R, S>,
    req: R,
    info: EventData
  ) {
    this.emitter = emitter;
    this.req = req;
    this.name = info.event;
    this.pattern = info.pattern;
    this.trigger = info.trigger;
  }
}
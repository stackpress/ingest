//framework
import type { Listener, ActionPayloadCallback } from '../framework/types';
import EventRouter from '../framework/Router';
import Status from '../framework/Status';
//payload
import type Request from '../payload/Request';
import type Response from '../payload/Response';
//runtime
import Emitter from './Emitter';

/**
 * Allows the ability to listen to events made known by another
 * piece of functionality. Events are items that transpire based
 * on an action. With events you can add extra functionality
 * right after the event has triggered.
 */
export default class Router<S = unknown, R = unknown> 
  extends EventRouter<ActionPayloadCallback, Request<S>, Response<R>> 
{
  /**
   * Calls all the actions of the given 
   * event passing the given arguments
   */
  public async emit(event: string, req: Request<S>, res: Response<R>) {
    const matches = this.match(event);

    //if there are no events found
    if (matches.size === 0) {
      //report a 404
      return Status.NOT_FOUND;
    }

    const emitter = this.makeEmitter();

    for (const event of matches) {
      //if no direct observers
      if (!this.listeners.has(event)) {
        continue;
      }

      //then loop the observers
      const listeners = this.listeners.get(event) as Set<
        Listener<ActionPayloadCallback>
      >;
      listeners.forEach(route => {
        emitter.add(route.action, route.priority);
      });
    }

    //call the callbacks
    return await emitter.emit(req, res);
  }

  /**
   * Returns a new emitter instance
   */
  public makeEmitter() {
    return new Emitter();
  }
};

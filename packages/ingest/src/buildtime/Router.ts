//framework
import type { Listener, ActionFile } from '../framework/types';
import EventRouter from '../framework/Router';
import Status from '../framework/Status';
//payload
import type Request from '../payload/Request';
import type Response from '../payload/Response';
//http
import type { IM, SR } from '../http/types';
//buildtime
import type { BuildOptions } from './types';
import Emitter from './Emitter';
import Manifest from './Manifest';

/**
 * Allows the ability to listen to events made known by another
 * piece of functionality. Events are items that transpire based
 * on an action. With events you can add extra functionality
 * right after the event has triggered.
 */
export default class Router 
  extends EventRouter<ActionFile, Request<IM>, Response<SR>> 
{
  /**
   * Calls all the actions of the given 
   * event passing the given arguments
   */
  public async emit(event: string, req: Request<IM>, res: Response<SR>) {
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
      const listeners = this.listeners.get(event) as Set<Listener<ActionFile>>;
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

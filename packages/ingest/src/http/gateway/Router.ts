//framework
import type { Listener } from '../../framework/types';
import FrameworkRouter from '../../framework/Router';
import Status from '../../framework/Status';
//general
import { routeParams } from '../../helpers';
//gateway
import type { IM, SR, GatewayAction } from './types';
import { imToURL } from '../helpers';
import Emitter from './Emitter';

/**
 * Allows the ability to listen to events made known by another
 * piece of functionality. Events are items that transpire based
 * on an action. With events you can add extra functionality
 * right after the event has triggered.
 */
export default class Router extends FrameworkRouter<GatewayAction, IM, SR> {
  /**
   * Calls all the actions of the given 
   * event passing the given arguments
   */
  public async emit(event: string, req: IM, res: SR) {
    const matches = this.match(event, req);

    //if there are no events found
    if (!Object.keys(matches).length) {
      //report a 404
      return Status.NOT_FOUND;
    }

    const emitter = this.makeEmitter();

    Object.values(matches).forEach(event => {
      const name = event.pattern?.toString() || event.trigger;
      //if no direct observers
      if (!this.listeners.has(name)) {
        return;
      }

      //then loop the observers
      const listeners = this.listeners.get(name) as Set<Listener<GatewayAction>>;
      listeners.forEach(route => {
        emitter.add(route.action, route.priority);
      });
    });

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
   * Returns possible event matches
   */
  public match(trigger: string, req?: IM) {
    const matches = super.match(trigger);
    if (req) {
      const url = imToURL(req);
      for (const event of Object.values(matches)) {
        const route = this.routes.get(event.pattern);
        if (route) {
          const { params, args } = routeParams(route.path, url.pathname);
          matches[event.pattern].params = Object.assign({}, args, params);
        }
        for (const [ key, value ] of Object.entries(event.params)) {
          url.searchParams.set(key, value as string);
        }
      }
    }
    return matches;
  }
};

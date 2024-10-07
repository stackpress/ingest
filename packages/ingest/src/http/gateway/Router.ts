//framework
import FrameworkRouter from '../../framework/Router';
//generic
import type { IM, SR, GatewayAction } from './types';
//gateway
import Emitter from './Emitter';

/**
 * Allows the ability to listen to events made known by another
 * piece of functionality. Events are items that transpire based
 * on an action. With events you can add extra functionality
 * right after the event has triggered.
 */
export default class Router extends FrameworkRouter<GatewayAction, IM, SR> {
  /**
   * Returns a new emitter instance
   */
  public makeEmitter() {
    return new Emitter();
  }
};

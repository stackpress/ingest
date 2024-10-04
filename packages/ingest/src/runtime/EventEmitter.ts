import type { ActionCallback } from '../event/types';

import AbstractEventEmitter from '../event/EventEmitter';
import Emitter from './Emitter';

/**
 * Allows the ability to listen to events made known by another
 * piece of functionality. Events are items that transpire based
 * on an action. With events you can add extra functionality
 * right after the event has triggered.
 */
export default class EventEmitter extends AbstractEventEmitter<ActionCallback> {
  /**
   * Returns a new emitter instance
   */
  public emitter() {
    return new Emitter();
  }
};

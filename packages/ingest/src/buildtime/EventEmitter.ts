import type { ActionFile } from '../event/types';
import type { BuildOptions } from './types';

import AbstractEventEmitter from '../event/EventEmitter';
import Emitter from './Emitter';
import Manifest from './Manifest';

/**
 * Allows the ability to listen to events made known by another
 * piece of functionality. Events are items that transpire based
 * on an action. With events you can add extra functionality
 * right after the event has triggered.
 */
export default class EventEmitter extends AbstractEventEmitter<ActionFile> {
  /**
   * Returns a new emitter instance
   */
  public emitter() {
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

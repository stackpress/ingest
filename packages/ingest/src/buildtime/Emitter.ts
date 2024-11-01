import type { BuildPayload, BuildMap, BuildTask } from './types';

import EventEmitter from '@stackpress/types/dist/EventEmitter';

/**
 * A rendition of an event emitter that uses 
 * entry files instead of action callbacks.
 */
export default class Emitter {
  public readonly emitter = new EventEmitter<BuildMap>();
  //A route map to task queues
  public readonly listeners = new Map<string, Set<BuildTask>>();

  /**
   * Calls all the callbacks of the given event passing the given arguments
   */
  public emit(event: string, req: BuildPayload[0], res: BuildPayload[1]) {
    return this.emitter.emit(event, req, res);
  }

  /**
   * Adds a callback to the given event listener
   */
  public on(event: string|RegExp, entry: string, priority = 0) {
    //convert the event to a string
    const pattern = event.toString();
    //if the listener group does not exist, create it
    if (!this.listeners.has(pattern)) {
      this.listeners.set(pattern, new Set());
    }
    //add the listener to the group
    this.listeners.get(pattern)?.add({ entry, priority });
    //add the event to the emitter
    this.emitter.on(event, async (req, res) => {
      const imports = await import(entry);
      const action = imports.default;
      //delete it from the require cache so it can be processed again
      delete require.cache[require.resolve(entry)];
      return await action(req, res);
    }, priority);
  }
};
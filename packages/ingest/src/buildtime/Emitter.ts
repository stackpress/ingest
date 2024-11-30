//stackpress
import EventEmitter from '@stackpress/types/dist/EventEmitter';
//common
import type Request from '../Request';
import type Response from '../Response';
//local
import type { BuildMap, BuildTask } from './types';

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
  public emit(event: string, req: Request, res: Response) {
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

    //----------------------------------------------//
    // NOTE: The following event only triggers when
    // manually emitting the event. Server doesn't
    // use this...
    //----------------------------------------------//

    //add the event to the emitter
    this.emitter.on(event, async (req, res) => {
      const imports = await import(entry);
      const action = imports.default;
      //delete it from the require cache so it can be processed again
      delete require.cache[require.resolve(entry)];
      return await action(req, res);
    }, priority);
    return this;
  }
};
import type { Entry, Listenable } from './types';

/**
 * Allows the ability to listen to events made known by another
 * piece of functionality. Events are items that transpire based
 * on an action. With events you can add extra functionality
 * right after the event has triggered.
 */
export default class EventRegistry {
  //A listener map to task queues
  public readonly listeners = new Map<string, Set<Entry>>();
  //Event regular expression map
  public readonly regexp = new Set<string>();

  /**
   * Adds a callback to the given event listener
   */
  on(event: Listenable, entry: string, priority: number = 0) {
    //deal with multiple events
    if (Array.isArray(event)) {
      event.forEach(event => this.on(event, entry, priority));
      return this;
    }

    //if it is a regexp object
    if (event instanceof RegExp) {
      //make it into a string
      event = event.toString()
      //go ahead and add the pattern
      //set guarantees uniqueness
      this.regexp.add(event);
    }

    //add the event to the listeners
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set<Entry>());
    }

    const tasks = this.listeners.get(event) as Set<Entry>;
    tasks.add({ priority, entry });
    return this
  }

  /**
   * Stops listening to an event
   */
  unbind(event?: string, entry?: string) {
    //if there is no event and not callable
    if (!event && !entry) {
      //it means that they want to remove everything
      for (let key in this.listeners) {
        this.listeners.delete(key);
      }
    //if there is an event and no entry
    } else if (event && !entry) {
      //remove all entries under this event
      this.listeners.delete(event);
    //if there is an event and an entry
    } else if (event && entry) {
      //remove the specific entry from the event
      const tasks = this.listeners.get(event);
      if (tasks) {
        tasks.forEach(task => {
          if(entry === task.entry) {
            tasks.delete(task);
          }
        });
      }
    //if there is no event and an entry
    } else if (!event && entry) {
      //remove the specific entry from all events
      for (const event in this.listeners) {
        const tasks = this.listeners.get(event);
        if (tasks) {
          tasks.forEach(task => {
            if(entry === task.entry) {
              tasks.delete(task);
            }
          });
        }
      }
    }

    return this;
  }
};

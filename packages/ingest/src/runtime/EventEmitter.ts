import type { Task, TaskRunner, Event, Listenable } from './types';
import type Request from '../payload/Request';
import type Response from '../payload/Response';
import type Context from './Context';

import Status from './StatusCode';
import TaskQueue from './TaskQueue';

/**
 * Allows the ability to listen to events made known by another
 * piece of functionality. Events are items that transpire based
 * on an action. With events you can add extra functionality
 * right after the event has triggered.
 */
export default class EventEmitter {
  //A listener map to task queues
  public readonly listeners = new Map<string, Set<Task>>();
 
  //Event regular expression map
  public readonly regexp = new Set<string>();

  /**
   * Returns a new task queue (defined like this so it can be overloaded)
   */
  static makeQueue() {
    return new TaskQueue();
  }

  /**
   * Calls all the callbacks of the given event passing the given arguments
   */
  async emit(event: string, req: Request, res: Response) {
    const matches = this.match(event);

    //if there are no events found
    if (!Object.keys(matches).length) {
      //report a 404
      return Status.NOT_FOUND;
    }

    const queue = EventEmitter.makeQueue();

    Object.keys(matches).forEach((key: string) => {
      const match = matches[key];
      const event = match.pattern;
      //if no direct observers
      if (!this.listeners.has(event)) {
        return;
      }

      //add args on to match
      match.request = req;
      match.response = res;

      //then loop the observers
      const tasks = this.listeners.get(event) as Set<Task>;
      tasks.forEach(listener => {
        queue.add(listener.callback, listener.priority)
      });
    });

    //call the callbacks
    return await queue.run(req, res, this as unknown as Context);
  }

  /**
   * Returns possible event matches
   */
  match(event: string): Record<string, Event> {
    const matches: Record<string, Event> = {};

    //first do the obvious match
    if (this.listeners.has(event)) {
      matches[event] = {
        event: event,
        pattern: event,
        parameters: []
      };
    }

    //next do the calculated matches
    this.regexp.forEach(pattern => {
      const regexp = new RegExp(
        // pattern,
        pattern.substring(
          pattern.indexOf('/') + 1,
          pattern.lastIndexOf('/')
        ),
        // flag
        pattern.substring(
          pattern.lastIndexOf('/') + 1
        )
      );

      //because String.matchAll only works for global flags ...
      let match, parameters: string[];
      if (regexp.flags.indexOf('g') === -1) {
        match = event.match(regexp);
        if (!match || !match.length) {
          return;
        }

        parameters = [];
        if (Array.isArray(match)) {
          parameters = match.slice();
          parameters.shift();
        }
      } else {
        match = Array.from(event.matchAll(regexp));
        if (!Array.isArray(match[0]) || !match[0].length) {
          return;
        }

        parameters = match[0].slice();
        parameters.shift();
      }

      matches[pattern] = { event, pattern, parameters };
    });

    return matches;
  }

  /**
   * Adds a callback to the given event listener
   */
  on(event: Listenable, callback: TaskRunner, priority: number = 0) {
    //deal with multiple events
    if (Array.isArray(event)) {
      event.forEach(event => this.on(event, callback, priority));
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
      this.listeners.set(event, new Set<Task>());
    }

    const tasks = this.listeners.get(event) as Set<Task>;
    tasks.add({ callback, priority })
    return this
  }

  /**
   * Stops listening to an event
   */
  unbind(event?: string, callback?: TaskRunner) {
    //if there is no event and not callable
    if (!event && !callback) {
      //it means that they want to remove everything
      for (let key in this.listeners) {
        this.listeners.delete(key);
      }
    //if there is an event and no entry
    } else if (event && !callback) {
      //remove all entries under this event
      this.listeners.delete(event);
    //if there is an event and an entry
    } else if (event && callback) {
      //remove the specific entry from the event
      const tasks = this.listeners.get(event);
      if (tasks) {
        tasks.forEach(task => {
          if(callback === task.callback) {
            tasks.delete(task);
          }
        });
      }
    //if there is no event and an entry
    } else if (!event && callback) {
      //remove the specific entry from all events
      for (const event in this.listeners) {
        const tasks = this.listeners.get(event);
        if (tasks) {
          tasks.forEach(task => {
            if(callback === task.callback) {
              tasks.delete(task);
            }
          });
        }
      }
    }

    return this;
  }
};

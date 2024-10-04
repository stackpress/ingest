import type { Listener, Listenable } from './types';

import Status from './StatusCode';

import Request from '../payload/Request';
import Response from '../payload/Response';

import Event from './Event';
import Emitter from './Emitter';

/**
 * Allows the ability to listen to events made known by another
 * piece of functionality. Events are items that transpire based
 * on an action. With events you can add extra functionality
 * right after the event has triggered.
 */
export default abstract class EventEmitter<A> {
  //A route map to task queues
  public readonly listeners = new Map<string, Set<Listener<A>>>();
  //Event regular expression map
  public readonly regexp = new Set<string>();

  /**
   * Returns a new emitter instance
   */
  public abstract emitter(): Emitter<A>;

  /**
   * Returns possible event matches
   */
  public match(event: string, req: Request) {
    const matches: Record<string, Event<A>> = {};
    //first do the obvious match
    if (this.listeners.has(event)) {
      matches[event] = new Event(this, req, event);
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

      matches[pattern] = new Event(this, req, event, regexp);
    });

    return matches;
  }

  /**
   * Adds a callback to the given event route
   */
  public on(event: Listenable, action: A, priority: number = 0) {
    //deal with multiple events
    if (Array.isArray(event)) {
      event.forEach(event => this.on(event, action, priority));
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
      this.listeners.set(event, new Set<Listener<A>>());
    }

    const listeners = this.listeners.get(event) as Set<Listener<A>>;
    listeners.add({ action, priority })
    return this
  }

  /**
   * Calls all the actions of the given 
   * event passing the given arguments
   */
  public async emit(event: string, req: Request, res: Response, cache = true) {
    const matches = this.match(event, req);

    //if there are no events found
    if (!Object.keys(matches).length) {
      //report a 404
      return Status.NOT_FOUND;
    }

    const emitter = this.emitter();

    Object.values(matches).forEach(event => {
      const name = event.regexp?.toString() || event.name;
      //if no direct observers
      if (!this.listeners.has(name)) {
        return;
      }

      //then loop the observers
      const listeners = this.listeners.get(name) as Set<Listener<A>>;
      listeners.forEach(route => {
        emitter.add(event, route.action, route.priority);
      });
    });

    //call the callbacks
    return await emitter.emit(req, res, undefined, cache);
  }

  /**
   * Stops listening to an event
   */
  public unbind(event?: string, action?: A) {
    //if there is no event and not callable
    if (!event && !action) {
      //it means that they want to remove everything
      for (let key in this.listeners) {
        this.listeners.delete(key);
      }
    //if there is an event and no entry
    } else if (event && !action) {
      //remove all entries under this event
      this.listeners.delete(event);
    //if there is an event and an entry
    } else if (event && action) {
      //remove the specific entry from the event
      const tasks = this.listeners.get(event);
      if (tasks) {
        tasks.forEach(task => {
          if(action === task.action) {
            tasks.delete(task);
          }
        });
      }
    //if there is no event and an entry
    } else if (!event && action) {
      //remove the specific entry from all events
      for (const event in this.listeners) {
        const tasks = this.listeners.get(event);
        if (tasks) {
          tasks.forEach(task => {
            if(action === task.action) {
              tasks.delete(task);
            }
          });
        }
      }
    }

    return this;
  }
};

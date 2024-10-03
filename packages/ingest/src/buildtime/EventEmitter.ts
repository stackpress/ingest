import type { Entry } from './types';
import type { SoftRequest } from '../runtime/types';

import type { Event } from '../runtime/types';

import Status from '../runtime/StatusCode';
import { isHash } from '../runtime/helpers';
import Request from '../payload/Request';
import Response from '../payload/Response';
import TaskQueue from './TaskQueue';
import EventRegistry from './EventRegistry';

export default class EventEmitter extends EventRegistry {
  /**
   * Returns a new task queue (defined like this so it can be overloaded)
   */
  static makeQueue() {
    return new TaskQueue();
  }

  /**
   * Emits the event and returns the response body
   */
  public async call(event: string, req?: SoftRequest, res?: Response) {
    const data = isHash(req) ? req : {};
    //firgure out the request
    const request = typeof req === 'undefined' || isHash(req)
      ? new Request()
      : req as Request;
    request.data.set(data);
    //figure out the response
    const response = res || new Response();
    await this.emit(event, request, response);
    return response?.data.get() as Record<string, unknown>;
  }

  /**
   * Calls all the callbacks of the given event passing the given arguments
   */
  async emit(event: string, req: Request, res: Response, cache = true) {
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
      const listeners = this.listeners.get(event) as Set<Entry>;
      listeners.forEach(listener => {
        queue.add(listener.entry, listener.priority)
      });
    });

    //call the callbacks
    return await queue.run(req, res, this, cache);
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
    })

    return matches;
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
}
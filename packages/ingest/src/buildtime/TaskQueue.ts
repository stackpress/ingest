import type { Entry } from './types';
import type Request from '../payload/Request';
import type Response from '../payload/Response';
import type EventRegistry from './EventRegistry';

import Status from '../runtime/StatusCode';
import TaskSorter from './TaskSorter';

export default class TaskQueue extends TaskSorter {
  /**
   * Runs the tasks (this is primarily used for dev mode)
   */
  async run(req: Request, res: Response, ctx: EventRegistry, cache = true) {
    if (!this.tasks.length) {
      //report a 404
      return Status.NOT_FOUND;
    }

    //first import all the tasks
    while (this.tasks.length) {
      const task = this.tasks.shift() as Entry;
      const entry = await import(task.entry);
      const run = entry.default;
      //if not cache
      if (!cache) {
        //delete it from the require cache so it can be processed again
        delete require.cache[require.resolve(task.entry)];
      }

      if (typeof run === 'function' && await run(req, res, ctx) === false) {
        return Status.ABORT;
      }
    }

    return Status.OK;
  }
}
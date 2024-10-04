import type { EventListener, ActionCallback } from '../event/types';
import type Event from '../event/Event';
import type Request from '../payload/Request';
import type Response from '../payload/Response';

import AbstractEmitter from '../event/Emitter';
import Status from '../event/StatusCode';

/**
 * Queues event listeners and runs the specified in order
 */
export default class Emitter extends AbstractEmitter<ActionCallback> {
  /**
   * Runs the tasks
   */
  public async emit(
    req: Request, 
    res: Response, 
    event?: Event<ActionCallback>
  ) {
    if (!this.queue.length) {
      //report a 404
      return Status.NOT_FOUND;
    }

    while (this.queue.length) {
      const { event: ctx, action } = (
        this.queue.shift() as EventListener<ActionCallback>
      );
      if (await action(req, res, event || ctx) === false) {
        return Status.ABORT;
      }
    }

    return Status.OK;
  }
};
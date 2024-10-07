//framework
import type { EventListener, ActionPayloadCallback } from '../framework/types';
import type Event from '../framework/Event';
import FrameworkEmitter from '../framework/Emitter';
import Status from '../framework/Status';
//payload
import type Request from '../payload/Request';
import type Response from '../payload/Response';

/**
 * Queues event listeners and runs the specified in order
 */
export default class Emitter 
  extends FrameworkEmitter<ActionPayloadCallback, Request, Response> 
{
  /**
   * Runs the tasks
   */
  public async emit(
    req: Request, 
    res: Response, 
    event?: Event<ActionPayloadCallback, Request, Response>
  ) {
    if (!this.queue.length) {
      //report a 404
      return Status.NOT_FOUND;
    }

    while (this.queue.length) {
      const { event: ctx, action } = (
        this.queue.shift() as EventListener<ActionPayloadCallback, Request, Response>
      );
      if (await action(req, res, event || ctx) === false) {
        return Status.ABORT;
      }
    }

    return Status.OK;
  }
};
//framework
import type { Listener, ActionPayloadCallback } from '../framework/types';
import FrameworkEmitter from '../framework/Queue';
import Status from '../framework/Status';
//payload
import type Request from '../payload/Request';
import type Response from '../payload/Response';

/**
 * Queues event listeners and runs the specified in order
 */
export default class Emitter<S = unknown, R = unknown> 
  extends FrameworkEmitter<ActionPayloadCallback> 
{
  /**
   * Runs the tasks
   */
  public async emit(req: Request<S>, res: Response<R>) {
    if (!this.queue.length) {
      //report a 404
      return Status.NOT_FOUND;
    }

    while (this.queue.length) {
      const { action } = (
        this.queue.shift() as Listener<ActionPayloadCallback>
      );
      if (await action(req, res) === false) {
        return Status.ABORT;
      }
    }

    return Status.OK;
  }
};
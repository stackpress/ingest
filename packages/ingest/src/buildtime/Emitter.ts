//framework
import type { EventListener, ActionFile } from '../framework/types';
import FrameworkEmitter from '../framework/Emitter';
import Status from '../framework/Status';
//payload
import type Request from '../payload/Request';
import type Response from '../payload/Response';
//buildtime
import type Event from '../framework/Event';

/**
 * Queues event listeners and runs the specified in order
 */
export default class Emitter 
  extends FrameworkEmitter<ActionFile, Request, Response> 
{
  /**
   * Runs the tasks
   */
  public async emit(
    req: Request, 
    res: Response, 
    event?: Event<ActionFile, Request, Response>, 
    cache = true
  ) {
    if (!this.queue.length) {
      //report a 404
      return Status.NOT_FOUND;
    }

    while (this.queue.length) {
      const { event: ctx, action } = (
        this.queue.shift() as EventListener<ActionFile, Request, Response>
      );
      const entry = await import(action);
      const run = entry.default;
      //if not cache
      if (!cache) {
        //delete it from the require cache so it can be processed again
        delete require.cache[require.resolve(action)];
      }

      if (typeof run === 'function' 
        && await run(req, res, event || ctx) === false
      ) {
        return Status.ABORT;
      }
    }

    return Status.OK;
  }
};
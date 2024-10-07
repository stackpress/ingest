//framework
import FrameworkEmitter from '../../framework/Emitter';
import Status from '../../framework/Status';
//http
import type { IM, SR, GatewayAction, GatewayEventListener } from './types';
//gateway
import type Event from './Event';

/**
 * Queues event listeners and runs the specified in order
 */
export default class Emitter extends FrameworkEmitter<GatewayAction, IM, SR> {
  /**
   * Runs the tasks
   */
  public async emit(
    req: IM, 
    res: SR, 
    event?: Event
  ) {
    if (!this.queue.length) {
      //report a 404
      return Status.NOT_FOUND;
    }

    while (this.queue.length) {
      const { event: ctx, action } = (
        this.queue.shift() as GatewayEventListener
      );
      if (await action(req, res, event || ctx) === false) {
        return Status.ABORT;
      }
    }

    return Status.OK;
  }
};
//framework
import FrameworkEmitter from '../../framework/Queue';
import Status from '../../framework/Status';
//http
import type { IM, SR, GatewayAction, GatewayListener } from './types';

/**
 * Queues event listeners and runs the specified in order
 */
export default class Emitter extends FrameworkEmitter<GatewayAction> {
  /**
   * Runs the tasks
   */
  public async emit(req: IM, res: SR) {
    if (!this.queue.length) {
      //report a 404
      return Status.NOT_FOUND;
    }

    while (this.queue.length) {
      const { action } = (
        this.queue.shift() as GatewayListener
      );
      if (await action(req, res) === false) {
        return Status.ABORT;
      }
    }

    return Status.OK;
  }
};
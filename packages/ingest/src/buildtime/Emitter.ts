//framework
import type { Listener, ActionFile } from '../framework/types';
import Queue from '../framework/Queue';
import Status from '../framework/Status';
//payload
import type Request from '../payload/Request';
import type Response from '../payload/Response';

/**
 * An abstract class, Emitter adds sorts actions in a queue. You need to 
 * define how it emits. The generics needed are the following.
 * 
 * - A - Action. Examples of an action could be a callback function or a 
 *   file location of an action callback.
 * - R - Request. The request object. Examples of a request could be 
 *   IncomingMessage, Fetch Request or the built-in `Request` defined
 *   in the `payload` folder. Though most of the time it should be the 
 *   built-in `Request` defined in the `payload` folder, we left this 
 *   generic to allow the `gateway` folder to re-use this class for 
 *   IncomingMessage.
 * - S - Response. The response object. Examples of a response could be 
 *   ServerResponse, Fetch Response or the built-in `Response` defined
 *   in the `payload` folder. Though most of the time it should be the 
 *   built-in `Response` defined in the `payload` folder, we left this 
 *   generic to allow the `gateway` folder to re-use this class for 
 *   ServerResponse.
 * 
 * The abstract function that needs to be defined looks like the following.
 * 
 * ```js
 * public abstract emit(
 *   req: R, 
 *   res: S, 
 *   event?: Event<A, R, S>,
 *   cache?: boolean
 * ): Promise<StatusCode>;
 * ```
 * 
 * The `buildtime` defines `emit()` to import an action file defined in 
 * the file router and calls it. The `runtime` uses `emit()` to simply 
 * call the action callback. The `gateway` uses `emit()` also to call 
 * the action callback, but passes IM, SR to the action.
 * 
 * `emit()` returns a `StatusCode` these codes are useful to find out 
 * what happened after the `emit()` was called. For example if there are 
 * no actions, the `Status` will be `NOT_FOUND`. If any of the actions 
 * returns `false`, then the next actions won't be called and the 
 * `Status` will be `ABORTED`. If all actions were called and the last 
 * one did not return `false`, then the `Status` will be `OK`.
 */
export default class Emitter extends Queue<ActionFile> {
  /**
   * Runs the tasks
   */
  public async emit(req: Request, res: Response) {
    if (!this.queue.length) {
      //report a 404
      return Status.NOT_FOUND;
    }

    while (this.queue.length) {
      const { action } = (
        this.queue.shift() as Listener<ActionFile>
      );
      const entry = await import(action);
      const run = entry.default;
      //delete it from the require cache so it can be processed again
      delete require.cache[require.resolve(action)];

      if (typeof run === 'function' && await run(req, res) === false) {
        return Status.ABORT;
      }
    }

    return Status.OK;
  }
};
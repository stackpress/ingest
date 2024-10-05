import type Router from './Router';

import Request from '../payload/Request';
import Response from '../payload/Response';
import Status from './Status';

export default abstract class Server<A, R, S, T> {
  //router to handle the requests
  public readonly router: Router<A>;
  //whether to use the require cache
  //when an entry is loaded
  public readonly cache: boolean;

  /**
   * Sets up the emitter
   */
  public constructor(router: Router<A>, cache = true) {
    this.router = router;
    this.cache = cache;
  }

  /**
   * Runs the 'response' event and interprets
   */
  public async dispatch(req: Request, res: Response) {
    //emit a response event
    const status = await this.router.emit('response', req, res, this.cache);
    //if the status was incomplete (308)
    return status.code !== Status.ABORT.code;
  }

  /**
   * Handles fetch requests
   */
  public abstract handle(request: R, response?: S): Promise<T>;

  /**
   * Runs the 'request' event and interprets
   */
  public async prepare(req: Request, res: Response) {
    const status = await this.router.emit('request', req, res, this.cache);
    //if the status was incomplete (308)
    return status.code !== Status.ABORT.code;
  }
}
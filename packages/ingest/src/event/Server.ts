import type EventEmitter from './EventEmitter';

import Exception from '../Exception';
import Request from '../payload/Request';
import Response from '../payload/Response';
import StatusCode from './StatusCode';

export default abstract class Server<A, R, S> {
  //router to handle the requests
  public readonly emitter: EventEmitter<A>;
  //whether to use the require cache
  //when an entry is loaded
  public readonly cache: boolean;

  /**
   * Sets up the emitter
   */
  public constructor(emitter: EventEmitter<A>, cache = true) {
    this.emitter = emitter;
    this.cache = cache;
  }

  /**
   * 3. Runs the 'response' event and interprets
   */
  public async dispatch(req: Request, res: Response) {
    //emit a response event
    const status = await this.emitter.emit('response', req, res, this.cache);
    //if the status was incomplete (308)
    return status.code !== StatusCode.ABORT.code;
  }

  /**
   * Handles a payload using events
   */
  public async emit(event: string, req: Request, res: Response) {
    //try to trigger request pre-processors
    if (!await this.prepare(req, res)) {
      //if the request exits, then stop
      return false;
    }
    // from here we can assume that it is okay to
    // continue with processing the routes
    if (!await this.process(event, req, res)) {
      //if the request exits, then stop
      return false;
    }
    //last call before dispatch
    if (!await this.dispatch(req, res)) {
      //if the dispatch exits, then stop
      return false;
    }
    //anything else?
    return true;
  }

  /**
   * Handles fetch requests
   */
  public abstract handle(request: R, response?: S): Promise<S>;

  /**
   * 1. Runs the 'request' event and interprets
   */
  public async prepare(req: Request, res: Response) {
    const status = await this.emitter.emit('request', req, res, this.cache);
    //if the status was incomplete (308)
    return status.code !== StatusCode.ABORT.code;
  }

  /**
   * 2. Runs the route event and interprets
   */
  public async process(event: string, req: Request, res: Response) {
    const status = await this.emitter.emit(event, req, res, this.cache);
    //if the status was incomplete (308)
    if (status.code === StatusCode.ABORT.code) {
      //the callback that set that should have already processed
      //the request and is signaling to no longer continue
      return false;
    }

    //if no body and status code
    //NOTE: it's okay if there is no body as 
    //      long as there is a status code
    //ex. like in the case of a redirect
    if (!res.body && !res.code) {
      res.code = StatusCode.NOT_FOUND.code;
      throw Exception
        .for(StatusCode.NOT_FOUND.message)
        .withCode(StatusCode.NOT_FOUND.code);
    }

    //if no status was set
    if (!res.code || !res.status) {
      //make it okay
      res.code = StatusCode.OK.code;
      res.status = StatusCode.OK.message;
    }

    //if the status was incomplete (308)
    return status.code !== StatusCode.ABORT.code;
  }
}
import type { FetchRequest, FetchResponse } from './helpers';
import type { ActionCallback } from '@stackpress/ingest/dist/event/types';
import type Emitter from '@stackpress/ingest/dist/runtime/Emitter';

import StatusCode from '@stackpress/ingest/dist/event/StatusCode';
import Request from '@stackpress/ingest/dist/payload/Request';
import Response from '@stackpress/ingest/dist/payload/Response';
import Exception from '@stackpress/ingest/dist/Exception';
import { loader, response } from './helpers';

export default class Server {
  /**
   * 3. Runs the 'response' event and interprets
   */
  public async dispatch(req: Request, res: Response) {
    //emit a response event
    const status = await this.context.emit('response', req, res);
    //if the status was incomplete (308)
    return status.code !== StatusCode.ABORT.code;
  }

  /**
   * Emit a series of events in order to catch and 
   * manipulate the payload in different stages
   */
  public async emit(queue: Emitter, req: Request, res: Response) {
    //try to trigger request pre-processors
    if (!await this.prepare(req, res)) {
      //if the request exits, then stop
      return false;
    }
    // from here we can assume that it is okay to
    // continue with processing the routes
    if (!await this.process(queue, req, res)) {
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
  public async handle(request: FetchRequest, queue: TaskQueue) {
    //initialize the request
    const { req, res } = await this.initialize(request);
    try { //to load the body
      await req.load();
      //then try to emit the event
      await this.emit(queue, req, res);
    } catch(e) {
      const error = e as Error;
      res.code = res.code && res.code !== 200 
        ? res.code: 500;
      res.status = res.status && res.status !== 'OK' 
        ? res.status : error.message;
      //let middleware contribute after error
      await this.context.emit('error', req, res);
    }
    //We would normally dispatch, but we can only create the
    //fetch response when all the data is ready...
    // if (!res.sent) {
    //   //send the response
    //   res.dispatch();
    // }
    //just map the ingets response to a fetch response
    return response(res);
  }

  /**
   * Sets up the request, response and determines the event
   */
  public async initialize(request: FetchRequest) {
    //setup the payload
    const req = new Request();
    req.loader = loader(request);
    const res = new Response();
    return { req, res };
  }

  /**
   * 1. Runs the 'request' event and interprets
   */
  public async prepare(req: Request, res: Response) {
    const status = await this.context.emit('request', req, res);
    //if the status was incomplete (308)
    return status.code !== StatusCode.ABORT.code;
  }

  /**
   * 2. Runs the route event and interprets
   */
  public async process(queue: TaskQueue, req: Request, res: Response) {
    const status = await queue.run(req, res, this.context);
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
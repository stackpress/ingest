import type { ServerOptions } from 'http';
import type { IM, SR } from './helpers';

import http from 'http';
import Exception from '../Exception';
import StatusCode from '../runtime/StatusCode';
import Request from '../payload/Request';
import Response from '../payload/Response';
import { loader, dispatcher, imToURL } from './helpers';
import Router from '../buildtime/Router';

export default class Developer {
  //runtime context shareable to all endpoints
  public readonly context: Router;

  /**
   * Pass the router to the context
   */
  public constructor(router: Router) {
    this.context = router;
  }

  /**
   * Creates an HTTP server with the given options
   */
  public create(options: ServerOptions = {}) {
    return http.createServer(options, (im, sr) => this.handle(im, sr));
  }

  /**
   * 3. Runs the 'response' event and interprets
   */
  public async dispatch(req: Request, res: Response) {
    //emit a response event
    const status = await this.context.emit('response', req, res, false);
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
  public async handle(im: IM, sr: SR) {
    //initialize the request
    const { event, req, res } = await this.initialize(im, sr);
    try { //to load the body
      await req.load();
      //then try to emit the event
      await this.emit(event, req, res);
    } catch(e) {
      const error = e as Error;
      res.code = res.code && res.code !== 200 
        ? res.code: 500;
      res.status = res.status && res.status !== 'OK' 
        ? res.status : error.message;
      //let middleware contribute after error
      await this.context.emit('error', req, res, false);
    }
    //if the response was not sent by now,
    if (!res.sent) {
      //send the response
      res.dispatch();
    }
    return sr;
  }

  /**
   * Sets up the request, response and determines the event
   */
  public async initialize(im: IM, sr: SR) {
    const req = new Request();
    req.loader = loader(im);
    const res = new Response();
    res.dispatcher = dispatcher(sr);
    const event = im.method + ' ' + imToURL(im).pathname;
    return { event, req, res };
  }

  /**
   * 1. Runs the 'request' event and interprets
   */
  public async prepare(req: Request, res: Response) {
    const status = await this.context.emit('request', req, res, false);
    //if the status was incomplete (308)
    return status.code !== StatusCode.ABORT.code;
  }

  /**
   * 2. Runs the route event and interprets
   */
  public async process(event: string, req: Request, res: Response) {
    const status = await this.context.emit(event, req, res, false);
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
//modules
import type { ServerOptions } from 'http';
import http from 'http';
import cookie from 'cookie';
//framework
import Status from '../framework/Status';
//payload
import Request from '../payload/Request';
import Response from '../payload/Response';
//http
import type { IM, SR } from '../http/types';
import { loader, dispatcher, imToURL } from '../http/helpers';
//general
import { objectFromQuery } from '../helpers';
//buildtime
import Router from './Router';

export default class Server {
  //router to handle the requests
  public readonly router: Router;

  /**
   * Sets up the emitter
   */
  public constructor(router: Router) {
    this.router = router;
  }

  /**
   * Creates an HTTP server with the given options
   */
  public create(options: ServerOptions = {}) {
    return http.createServer(options, (im, sr) => this.handle(im, sr));
  }

  /**
   * Handles fetch requests
   */
  public async handle(im: IM, sr: SR) {
    //initialize the request
    const { event, req, res } = this._makePayload(im, sr);
    //load the body
    await req.load();
    //then try to emit the event
    await this.process(event, req, res);
    //if the response was not sent by now,
    if (!res.sent) {
      //send the response
      res.dispatch();
    }
    return sr;
  }

  /**
   * Handles a payload using events
   */
  public async process(event: string, req: Request<IM>, res: Response<SR>) {
    const status = await this.router.emit(event, req, res);
    //if the status was incomplete (308)
    if (status.code === Status.ABORT.code) {
      //the callback that set that should have already processed
      //the request and is signaling to no longer continue
      return false;
    }

    //if no body and status code
    //NOTE: it's okay if there is no body as 
    //      long as there is a status code
    //ex. like in the case of a redirect
    if (!res.body && !res.code) {
      res.code = Status.NOT_FOUND.code;
      res.status = Status.NOT_FOUND.message;
      res.body = `${Status.NOT_FOUND.code} ${Status.NOT_FOUND.message}`;
    }

    //if no status was set
    if (!res.code || !res.status) {
      //make it okay
      res.code = Status.OK.code;
      res.status = Status.OK.message;
    }

    //if the status was incomplete (308)
    return status.code !== Status.ABORT.code;
  }

  /**
   * Sets up the request, response and determines the event
   */
  protected _makePayload(im: IM, sr: SR) {
    //set the type
    const mimetype = im.headers['content-type'] || 'text/plain';
    //set the headers
    const headers = Object.fromEntries(
      Object.entries(im.headers).filter(
        ([key, value]) => typeof value !== 'undefined'
      )
    ) as Record<string, string|string[]>;
    //set session
    const session = cookie.parse(im.headers.cookie as string || '');
    //set url
    const url = imToURL(im);
    //set query
    const query = objectFromQuery(url.searchParams.toString());
    //make request
    const req = new Request({
      mimetype,
      headers,
      url,
      query,
      session,
      resource: im
    });
    req.loader = loader(im);
    //make response
    const res = new Response({ resource: sr });
    res.dispatcher = dispatcher(sr);
    const event = im.method + ' ' + imToURL(im).pathname;
    return { event, req, res };
  }
}
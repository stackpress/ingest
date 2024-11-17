//modules
import type { ServerOptions } from 'http';
import type { Method } from '@stackpress/types/dist/types';
import http from 'http';
import cookie from 'cookie';
import StatusCode from '@stackpress/types/dist/StatusCode';
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
    //if the status was incomplete (309)
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
      const { code, status } = StatusCode.NOT_FOUND;
      res.code = code;
      res.body = `${code} ${status}`;
    }

    //if no status was set
    if (!res.code || !res.status) {
      //make it okay
      res.status = StatusCode.OK;
    }

    //if the status was incomplete (309)
    return status.code !== StatusCode.ABORT.code;
  }

  /**
   * Sets up the request, response and determines the event
   */
  protected _makePayload(im: IM, sr: SR) {
    //set method
    const method = (im.method?.toUpperCase() || 'GET') as Method;
    //set the type
    const mimetype = im.headers['content-type'] || 'text/plain';
    //set the headers
    const headers = Object.fromEntries(
      Object.entries(im.headers).filter(
        ([key, value]) => typeof value !== 'undefined'
      )
    ) as Record<string, string|string[]>;
    //set session
    const session = cookie.parse(
      im.headers.cookie as string || ''
    ) as Record<string, string>;
    //set url
    const url = imToURL(im);
    //set query
    const query = objectFromQuery(url.searchParams.toString());
    //make request
    const req = new Request({
      method,
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
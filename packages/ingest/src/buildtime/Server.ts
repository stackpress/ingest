//modules
import type { ServerOptions as HTTPOptions } from 'http';
import http from 'http';
import * as cookie from 'cookie';
//stackpress
import type { Method } from '@stackpress/types/dist/types';
import StatusCode from '@stackpress/types/dist/StatusCode';
//common
import type { IM, SR, ServerOptions, CookieOptions } from '../types';
import Request from '../Request';
import Response from '../Response';
import { objectFromQuery } from '../helpers';
//runtime
import { loader, dispatcher } from '../runtime/http/Route';
//local
import Router from './Router';
import { imToURL } from './helpers';

export { loader, dispatcher };

export default class Server {
  //router to handle the requests
  public readonly router: Router;
  //cookie options
  public readonly cookie: CookieOptions;
  //request size
  public readonly size: number;

  /**
   * Sets up the emitter
   */
  public constructor(router: Router, options: ServerOptions = {}) {
    this.router = router;
    this.cookie = Object.freeze(options.cookie || { path: '/' });
    this.size = options.size || 0;
  }

  /**
   * Creates an HTTP server with the given options
   */
  public create(options: HTTPOptions = {}) {
    return http.createServer(options, (im, sr) => this.handle(im, sr));
  }

  /**
   * Handles fetch requests
   */
  public async handle(im: IM, sr: SR) {
    //initialize the request
    const event = im.method + ' ' + imToURL(im).pathname;
    const req = this.request(im);
    const res = this.response(sr);
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
  public async process(event: string, req: Request, res: Response) {
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
   * Sets up the request
   */
  public request(im: IM) {
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
    req.loader = loader(im, this.size);
    return req;
  }

  /**
   * Sets up the response
   */
  public response(sr: SR) {
    const res = new Response({ resource: sr });
    res.dispatcher = dispatcher(sr, this.cookie);
    return res;
  }
}
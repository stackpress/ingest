import type { Method } from '@stackpress/types/dist/types';
import StatusCode from '@stackpress/types/dist/StatusCode';
//modules
import cookie from 'cookie';
//payload
import Request from '../payload/Request';
import Response from '../payload/Response';
//general
import { objectFromQuery } from '../helpers';
//http
import type { IM, SR, HTTPAction } from './types';
import Queue from './Queue';
import Router from './Router';
import { loader, dispatcher, imToURL } from './helpers';

export default class Server {
  //router to handle the requests
  public readonly router: Router;

  /**
   * Sets up the emitter
   */
  public constructor(router?: Router) {
    this.router = router || new Router();
  }

  /**
   * Handles fetch requests
   */
  public async handle(actions: Set<HTTPAction>, im: IM, sr: SR) {
    //initialize the request
    const { req, res } = this._makePayload(im, sr);
    const queue = this._makeQueue(actions);
    //load the body
    await req.load();
    //then try to emit the event
    await this.process(queue, req, res);
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
  public async process(queue: Queue, req: Request<IM>, res: Response<SR>) {
    const status = await queue.run(req, res);
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
   * Creates a queue and populates it with actions
   */
  protected _makeQueue(actions: Set<HTTPAction>) {
    const emitter = new Queue();
    actions.forEach(action => emitter.add(action));

    return emitter;
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
    const req = new Request<IM>({
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
    const res = new Response<SR>({ resource: sr });
    res.dispatcher = dispatcher(sr);
    return { req, res };
  }
}
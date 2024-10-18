//modules
import cookie from 'cookie';
//framework
import type { Method } from '@stackpress/ingest/dist/framework/types';
import Status from '@stackpress/ingest/dist/framework/Status';
//payload
import Request from '@stackpress/ingest/dist/payload/Request';
import Response from '@stackpress/ingest/dist/payload/Response';
//runtime
import Emitter from '@stackpress/ingest/dist/runtime/Emitter';
import Router from '@stackpress/ingest/dist/runtime/Router';
//general
import { objectFromQuery } from '@stackpress/ingest/dist/helpers';
//vercel

import type { FetchRequest, ActionSet } from './types';
import { loader, response } from './helpers';

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
  public async handle(actions: ActionSet, request: FetchRequest) {
    //initialize the request
    const { req, res } = this._makePayload(request);
    const emitter = this._makeEmitter(actions);
    //load the body
    await req.load();
    //then try to emit the event
    await this.process(emitter, req, res);
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
   * Emit a series of events in order to catch and 
   * manipulate the payload in different stages
   */
  public async process(emitter: Emitter, req: Request, res: Response) {
    const status = await emitter.emit(req, res);
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
   * Creates an emitter and populates it with actions
   */
  protected _makeEmitter(actions: ActionSet) {
    const emitter = new Emitter();
    actions.forEach(action => {
      emitter.add(action);
    });

    return emitter;
  }

  /**
   * Sets up the request, response and determines the event
   */
  protected _makePayload(request: FetchRequest) {
    //set method
    const method = (request.method?.toUpperCase() || 'GET') as Method;
    //set the type
    const mimetype = request.headers.get('content-type') || 'text/plain';
    //set the headers
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      if (typeof value !== 'undefined') {
        headers[key] = value;
      }
    });
    //set session
    const session = cookie.parse(
      request.headers.get('cookie') as string || ''
    );
    //set url
    const url = new URL(request.url);
    //set query
    const query = objectFromQuery(url.searchParams.toString());

    //setup the payload
    const req = new Request({
      method,
      mimetype,
      headers,
      url,
      query,
      session,
      resource: request
    });
    req.loader = loader(request);
    const res = new Response();
    return { req, res };
  }
}
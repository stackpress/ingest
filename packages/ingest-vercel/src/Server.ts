//modules
import type { Method } from '@stackpress/types/dist/types';
import cookie from 'cookie';
import StatusCode from '@stackpress/types/dist/StatusCode';
//payload
import type { CookieOptions } from '@stackpress/ingest/dist/payload/types';
import Request from '@stackpress/ingest/dist/payload/Request';
import Response from '@stackpress/ingest/dist/payload/Response';
//general
import { objectFromQuery } from '@stackpress/ingest/dist/helpers';
//vercel
import type { FetchRequest, FetchAction } from './types';
import Queue from './Queue';
import Router from './Router';
import { loader, response } from './helpers';

export default class Server {
  //router to handle the requests
  public readonly router: Router;
  //cookie options
  protected _options: CookieOptions;

  /**
   * Sets up the emitter
   */
  public constructor(router?: Router, options: CookieOptions = { path: '/' }) {
    this.router = router || new Router();
    this._options = options;
  }

  /**
   * Handles fetch requests
   */
  public async handle(actions: Set<FetchAction>, request: FetchRequest) {
    //initialize the request
    const { req, res } = this._makePayload(request);
    const queue = this._makeQueue(actions);
    //load the body
    await req.load();
    //then try to emit the event
    await this.process(queue, req, res);
    //We would normally dispatch, but we can only create the
    //fetch response when all the data is ready...
    // if (!res.sent) {
    //   //send the response
    //   res.dispatch();
    // }
    //just map the ingets response to a fetch response
    return response(res, this._options);
  }

  /**
   * Emit a series of events in order to catch and 
   * manipulate the payload in different stages
   */
  public async process(
    queue: Queue, 
    req: Request<FetchRequest>, 
    res: Response<undefined>
  ) {
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
   * Creates an emitter and populates it with actions
   */
  protected _makeQueue(actions: Set<FetchAction>) {
    const queue = new Queue();
    actions.forEach(action => queue.add(action));
    return queue;
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
    const req = new Request<FetchRequest>({
      method,
      mimetype,
      headers,
      url,
      query,
      session,
      resource: request
    });
    req.loader = loader(request);
    const res = new Response<undefined>();
    return { req, res };
  }
}
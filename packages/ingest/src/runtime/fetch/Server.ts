//modules
import type { Method } from '@stackpress/types/dist/types';
import * as cookie from 'cookie';
import StatusCode from '@stackpress/types/dist/StatusCode';
//common
import type { 
  Body, 
  ServerOptions,
  CookieOptions, 
  LoaderResponse, 
  FetchRequest 
} from '../../types';
import Request from '../../Request';
import Response from '../../Response';
import { isHash, formDataToObject, objectFromQuery } from '../../helpers';
//local
import type { FetchAction } from './types';
import Queue from './Queue';
import Router from './Router';
import { NativeResponse } from './helpers';

export default class Server<C = unknown> {
  //router to handle the requests
  public readonly router: Router<C>;
  //cookie options
  public readonly cookie: CookieOptions;
  //request size
  public readonly size: number;
  //any client interface
  protected _client?: C;

  /**
   * Returns the client interface
   */
  public get client() {
    return this._client as C;
  }

  /**
   * Sets up the emitter
   */
  public constructor(router?: Router<C>, options: ServerOptions<C> = {}) {
    this.router = router || new Router<C>();
    this.cookie = Object.freeze(options.cookie || { path: '/' });
    this.size = options.size || 0;
    this._client = options.client;
  }

  /**
   * Handles fetch requests
   */
  public async handle(actions: Set<FetchAction<C>>, request: FetchRequest) {
    //initialize the request
    const req = this.request(request);
    const res = this.response();
    const queue = this.queue(actions);
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
    return response(res, this.cookie);
  }

  /**
   * Emit a series of events in order to catch and 
   * manipulate the payload in different stages
   */
  public async process(
    queue: Queue<C>, 
    req: Request<FetchRequest, C>, 
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
  public queue(actions: Set<FetchAction<C>>) {
    const queue = new Queue<C>();
    actions.forEach(action => queue.add(action));
    return queue;
  }

  /**
   * Sets up the request
   */
  public request(request: FetchRequest) {
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
    ) as Record<string, string>;
    //set url
    const url = new URL(request.url);
    //set query
    const query = objectFromQuery(url.searchParams.toString());

    //setup the payload
    const req = new Request<FetchRequest, C>({
      method,
      mimetype,
      headers,
      url,
      query,
      session,
      resource: request,
      client: this._client
    });
    req.loader = loader<C>(request);
    return req;
  }

  /**
   * Sets up the response
   */
  public response() {
    return new Response<undefined>();;
  }
}

/**
 * Request body loader
 */
export function loader<C = unknown>(resource: FetchRequest) {
  return (req: Request<FetchRequest, C>) => {
    return new Promise<LoaderResponse|undefined>(async resolve => {
      //if the body is cached
      if (req.body !== null) {
        resolve(undefined);
      }

      const body = await resource.text();
      const post = formDataToObject(req.type, body)

      resolve({ body, post });
    });
  } 
};

/**
 * Maps out an Ingest Response to a Fetch Response
 */
export async function response(
  res: Response, 
  options: CookieOptions = { path: '/' }
) {
  let mimetype = res.mimetype;
  let body: Body|null = null;
  //if body is a valid response
  if (typeof res.body === 'string' 
    || Buffer.isBuffer(res.body) 
    || res.body instanceof Uint8Array
  ) {
    body = res.body;
  //if body is an object or array
  } else if (isHash(res.body) || Array.isArray(res.body)) {
    res.mimetype = 'application/json';
    body = JSON.stringify({
      code: res.code,
      status: res.status,
      results: res.body,
      error: res.error,
      errors: res.errors.size > 0 ? res.errors.get() : undefined,
      total: res.total > 0 ? res.total : undefined
    });
  } else if (res.code && res.status) {
    res.mimetype = 'application/json';
    body = JSON.stringify({
      code: res.code,
      status: res.status,
      error: res.error,
      errors: res.errors.size > 0 ? res.errors.get() : undefined,
      stack: res.stack ? res.stack : undefined
    });
  }
  //create response
  const response = new NativeResponse(body, {
    status: res.code,
    statusText: res.status
  });
  //write cookies
  for (const [name, entry] of res.session.revisions.entries()) {
    if (entry.action === 'remove') {
      response.headers.set(
        'Set-Cookie', 
        cookie.serialize(name, '', { ...options, expires: new Date(0) })
      );
    } else if (entry.action === 'set' 
      && typeof entry.value !== 'undefined'
    ) {
      const { value } = entry;
      const values = Array.isArray(value) ? value : [ value ];
      for (const value of values) {
        response.headers.set(
          'Set-Cookie', 
          cookie.serialize(name, value, options)
        );
      }
    }
  }
  //write headers
  for (const [ name, value ] of res.headers.entries()) {
    const values = Array.isArray(value) ? value : [ value ];
    for (const value of values) {
      response.headers.set(name, value);
    }
  }
  //set content type
  if (mimetype) {
    response.headers.set('Content-Type', mimetype);
  }
  return response;
}
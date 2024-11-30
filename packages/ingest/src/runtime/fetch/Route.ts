//modules
import { Readable } from 'stream';
import * as cookie from 'cookie';
//stackpress
import type { Method, UnknownNest } from '@stackpress/types/dist/types';
//common
import type { 
  Body, 
  RouteOptions,
  CookieOptions, 
  LoaderResponse, 
  FetchRequest,
  ResponseInitializer,
  FetchRequestInitializer
} from '../../types';
import Factory from '../../Factory';
import Request from '../../Request';
import Response from '../../Response';
import { 
  isHash, 
  formDataToObject, 
  objectFromQuery,
  readableToReadableStream
} from '../../helpers';
//local
import type { RouteAction } from './types';
import Queue from './Queue';
import Plugin from './Plugin';
import { NativeResponse } from './helpers';

export default class Route<C extends UnknownNest = UnknownNest> 
  extends Factory<C>
{
  /**
   * Loads the plugins and returns the factory
   */
  public static async bootstrap<C extends UnknownNest = UnknownNest>(
    options: RouteOptions = {}
  ) {
    const factory = new Route<C>(options);
    return await factory.bootstrap();
  }

  //body size
  protected _size: number;
  //cookie options
  protected _cookie: CookieOptions;

  /**
   * Sets up the route
   */
  public constructor(options: RouteOptions = {}) {
    const { 
      size = 0,
      cookie = { path: '/' }, 
      ...config 
    } = options;
    super({ key: 'client', ...config });
    this._size = size;
    this._cookie = cookie;
  }

  /**
   * Handles entry file requests
   * 
   * NOTE: groupings are by exact event name/pattern match
   * it doesn't take into consideration an event trigger
   * can match multiple patterns. For example the following 
   * wont be grouped together.
   * 
   * ie. GET /user/:id and GET /user/search
   */
  public async handle(
    route: string, 
    actions: Set<RouteAction>, 
    request: FetchRequest
  ) {
    //initialize the request
    const req = this.request({ resource: request });
    const res = this.response();
    const queue = this.queue(actions);
    const ctx = req.fromRoute(route);
    //load the body
    await req.load();
    //bootstrap the plugins
    await this.bootstrap();
    //hook the plugins
    await Plugin.hook<C>(this, queue, ctx, res);
    //We would normally dispatch, but we can only create the
    //fetch response when all the data is ready...
    // if (!res.sent) {
    //   //send the response
    //   res.dispatch();
    // }
    //just map the ingets response to a fetch response
    const cookie = this.config<CookieOptions>('cookie') || this._cookie;
    return response(res, cookie);
  }

  /**
   * Creates an emitter and populates it with actions
   */
  public queue(actions: Set<RouteAction>) {
    const queue = new Queue();
    actions.forEach(action => queue.add(action));
    return queue;
  }

  /**
   * Sets up the request
   */
  public request(init?: FetchRequestInitializer<Route<C>>) {
    if (!init) {
      return new Request<Route<C>>({ context: this });
    }
    const request = init.resource;
    //set context
    init.context = this;
    //set method
    init.method = (request.method?.toUpperCase() || 'GET') as Method;
    //set the type
    init.mimetype = request.headers.get('content-type') || 'text/plain';
    //set the headers
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      if (typeof value !== 'undefined') {
        headers[key] = value;
      }
    });
    init.headers = init.headers || headers;
    //set session
    init.session = init.session || cookie.parse(
      request.headers.get('cookie') as string || ''
    ) as Record<string, string>;
    //set url
    const url = new URL(request.url);
    init.url = init.url || url;
    //set query
    init.query = init.query 
      || objectFromQuery(url.searchParams.toString());
    //setup the payload
    const req = new Request<Route<C>>(init);
    req.loader = loader(request);
    return req;
  }

  /**
   * Sets up the response
   */
  public response(init?: ResponseInitializer) {
    return new Response(init);
  }
}

/**
 * Request body loader
 */
export function loader(resource: FetchRequest, size = 0) {
  return (req: Request) => {
    return new Promise<LoaderResponse|undefined>(async resolve => {
      //if the body is cached
      if (req.body !== null) {
        resolve(undefined);
      }
      //TODO: limit the size of the body
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
  //fetch type responses dont start with a resource
  //so if it magically has a resource, then it must 
  //have been set in a route. So we can just return it.
  if (res.resource instanceof NativeResponse) {
    return res.resource;
  }
  let mimetype = res.mimetype;
  let body: Body|null = null;
  //if body is a valid response
  if (typeof res.body === 'string' 
    || Buffer.isBuffer(res.body) 
    || res.body instanceof Uint8Array
    || res.body instanceof ReadableStream
  ) {
    body = res.body;
  //if it's a node stream
  } else if (res.body instanceof Readable) {
    body = readableToReadableStream(res.body);
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
};

export function bootstrap<C extends UnknownNest = UnknownNest>(
  options: RouteOptions = {}
) {
  return Route.bootstrap<C>(options);
};

export function route<C extends UnknownNest = UnknownNest>(
  options: RouteOptions = {}
) {
  return new Route<C>(options);
};
//modules
import { Readable } from 'stream';
import * as cookie from 'cookie';
//stackpress
import type { Method, UnknownNest } from '@stackpress/types/dist/types';
//common
import type { 
  IM, 
  SR, 
  RouteOptions,
  CookieOptions, 
  LoaderResponse,
  IMRequestInitializer,
  SRResponseInitializer
} from '../../types';
import Factory from '../../Factory';
import Request from '../../Request';
import Response from '../../Response';
import Exception from '../../Exception';
import { 
  isHash, 
  formDataToObject, 
  objectFromQuery,
  readableStreamToReadable
} from '../../helpers';
//local
import type { RouteAction } from './types';
import Queue from './Queue';
import Plugin from './Plugin';
import { imToURL } from './helpers';

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
    im: IM, 
    sr: SR
  ) {
    //initialize the request
    const req = this.request({ resource: im });
    const res = this.response({ resource: sr });
    const queue = this.queue(actions);
    const ctx = req.fromRoute(route);
    //load the body
    await req.load();
    //bootstrap the plugins
    await this.bootstrap();
    //hook the plugins
    await Plugin.hook<C>(this, queue, ctx, res);
    //if the response was not sent by now,
    if (!res.sent) {
      //send the response
      res.dispatch();
    }
    return sr;
  }

  /**
   * Sets up the queue
   */
  public queue(actions: Set<RouteAction>) {
    const emitter = new Queue();
    actions.forEach(action => emitter.add(action));
    return emitter;
  }

  /**
   * Sets up the request
   */
  public request(init?: IMRequestInitializer<Route<C>>) {
    if (!init) {
      return new Request<Route<C>>({ context: this });
    }
    const im = init.resource;
    //set context
    init.context = this;
    //set method
    init.method = init.method 
      || (im.method?.toUpperCase() || 'GET') as Method;
    //set the type
    init.mimetype = init.mimetype 
      || im.headers['content-type'] 
      || 'text/plain';
    //set the headers
    init.headers = init.headers || Object.fromEntries(
      Object.entries(im.headers).filter(
        ([key, value]) => typeof value !== 'undefined'
      )
    ) as Record<string, string|string[]>;
    //set session
    init.session = init.session || cookie.parse(
      im.headers.cookie as string || ''
    ) as Record<string, string>;
    //set url
    const url = imToURL(im);
    init.url = init.url || url;
    //set query
    init.query = init.query 
      || objectFromQuery(url.searchParams.toString());
    //make request
    const req = new Request<Route<C>>(init);
    const size = this.config<number>('server', 'bodySize') || this._size;
    req.loader = loader(im, size);
    return req;
  }

  /**
   * Sets up the response
   */
  public response(init?: SRResponseInitializer) {
    if (!init) {
      return new Response();
    }
    const sr = init.resource;
    const res = new Response(init);
    const cookie = this.config<CookieOptions>('cookie') || this._cookie;
    res.dispatcher = dispatcher(sr, cookie);
    return res;
  }
}

/**
 * Request body loader
 */
export function loader(resource: IM, size = 0) {
  return (req: Request) => {
    return new Promise<LoaderResponse|undefined>(resolve => {
      //if the body is cached
      if (req.body !== null) {
        resolve(undefined);
      }

      //we can only request the body once
      //so we need to cache the results
      let body = '';
      resource.on('data', chunk => {
        body += chunk;
        Exception.require(
          !size || body.length <= size, 
          `Request exceeds ${size}`
        );
      });
      resource.on('end', () => {
        resolve({ body, post: formDataToObject(req.mimetype, body) });
      });
    });
  } 
};

/**
 * Response dispatcher
 */
export function dispatcher(
  resource: SR, 
  options: CookieOptions = { path: '/' }
) {
  return (res: Response) => {
    return new Promise<void>(resolve => {
      //set code and status
      resource.statusCode = res.code;
      resource.statusMessage = res.status;
      //write cookies
      for (const [name, entry] of res.session.revisions.entries()) {
        if (entry.action === 'remove') {
          resource.setHeader(
            'Set-Cookie', 
            cookie.serialize(name, '', { ...options, expires: new Date(0) })
          );
        } else if (entry.action === 'set' 
          && typeof entry.value !== 'undefined'
        ) {
          const { value } = entry;
          const values = Array.isArray(value) ? value : [ value ];
          for (const value of values) {
            resource.setHeader(
              'Set-Cookie', 
              cookie.serialize(name, value, options)
            );
          }
        }
      }
      //write headers
      for (const [ name, value ] of res.headers.entries()) {
        resource.setHeader(name, value);
      }
      //set content type
      if (res.mimetype) {
        resource.setHeader('Content-Type', res.mimetype);
      }
      //if body is a valid response
      if (typeof res.body === 'string' 
        || Buffer.isBuffer(res.body) 
        || res.body instanceof Uint8Array
      ) {
        resource.end(res.body);
      //if it's a node stream
      } else if (res.body instanceof Readable) {
        res.body.pipe(resource);
      //if it's a web stream
      } else if (res.body instanceof ReadableStream) {
        //convert to node stream
        readableStreamToReadable(res.body).pipe(resource);
      //if body is an object or array
      } else if (isHash(res.body) || Array.isArray(res.body)) {
        resource.setHeader('Content-Type', 'application/json');
        resource.end(JSON.stringify({
          code: res.code,
          status: res.status,
          results: res.body,
          error: res.error,
          errors: res.errors.size > 0 ? res.errors.get() : undefined,
          total: res.total > 0 ? res.total : undefined,
          stack: res.stack ? res.stack : undefined
        }));
      } else if (res.code && res.status) {
        resource.setHeader('Content-Type', 'application/json');
        resource.end(JSON.stringify({
          code: res.code,
          status: res.status,
          error: res.error,
          errors: res.errors.size > 0 ? res.errors.get() : undefined,
          stack: res.stack ? res.stack : undefined
        }));
      }
      //type Body = string | Buffer | Uint8Array 
      // | Record<string, unknown> | unknown[]
      
      //we cased for all possible types so it's 
      //better to not infer the response body
      resolve();
    });
  } 
};

export function bootstrap<C extends UnknownNest = UnknownNest>(
  options: RouteOptions = {}
) {
  return Route.bootstrap<C>(options);
}

export function route<C extends UnknownNest = UnknownNest>(
  options: RouteOptions = {}
) {
  return new Route<C>(options);
}
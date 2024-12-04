//modules
import { Readable } from 'node:stream';
import * as cookie from 'cookie';
//stackpress
import type { Method, UnknownNest } from '@stackpress/types/dist/types';
//common
import type { 
  IM,
  SR,
  HTTPServer,
  HTTPEntryAction,
  LoaderResults,
  CookieOptions
} from '../types';
import Route from '../Route';
import Request from '../Request';
import Response from '../Response';
import Exception from '../Exception';
import { 
  isHash,
  objectFromQuery,
  formDataToObject
} from '../helpers';
//local
import { imToURL, readableStreamToReadable } from './helpers';

export default class Adapter<C extends UnknownNest = UnknownNest> {
  /**
   * Server request handler
   */
  public static async plug<C extends UnknownNest = UnknownNest>(
    context: HTTPServer<C>, 
    request: IM,
    response: SR,
    action?: HTTPEntryAction<C>
  ) {
    const server = new Adapter(context, request, response);
    return server.plug(action);
  };

  //the parent server context
  protected _context: HTTPServer<C>;
  //the native request
  protected _request: IM;
  //the native response
  protected _response: SR;

  /**
   * Sets up the server
   */
  constructor(context: HTTPServer<C>, request: IM, response: SR) {
    this._context = context;
    this._request = request;
    this._response = response;
  }

  /**
   * Handles the request
   */
  public async plug(action?: HTTPEntryAction<C>) {
    //initialize the request
    const req = this.request();
    const res = this.response();
    //determine event name
    const event = action || `${req.method} ${req.url.pathname}`;
    //load the body
    await req.load();
    //hook the plugins
    await Route.emit<C, IM, SR>(event, req, res);
    //if the response was not sent by now,
    if (!res.sent) {
      //send the response
      return res.dispatch();
    }
    return res.resource;
  }

  /**
   * Sets up the request
   */
  public request() {
    //set context
    const context = this._context;
    //set resource
    const resource = this._request;
    //set method
    const method = (this._request.method?.toUpperCase() || 'GET') as Method;
    //set the type
    const mimetype = this._request.headers['content-type'] || 'text/plain';
    //set the headers
    const headers = Object.fromEntries(
      Object.entries(this._request.headers).filter(
        ([key, value]) => typeof value !== 'undefined'
      )
    ) as Record<string, string|string[]>;
    //set session
    const session = cookie.parse(
      this._request.headers.cookie as string || ''
    ) as Record<string, string>;
    //set url
    const url = imToURL(this._request);
    //set query
    const query = objectFromQuery(url.searchParams.toString());
    //setup the payload
    const request = new Request<IM, HTTPServer<C>>({
      context,
      resource,
      headers,
      method,
      mimetype,
      query,
      session,
      url
    });
    request.loader = loader<C>(this._request);
    return request;
  }

  /**
   * Sets up the response
   */
  public response() {
    const response = new Response<SR>({ resource: this._response });
    response.dispatcher = dispatcher(
      this._context.config<CookieOptions>('cookie') || { path: '/' }
    );
    return response;
  }
}



/**
 * Request body loader
 */
export function loader<C extends UnknownNest = UnknownNest>(
  resource: IM, 
  size = 0
) {
  return (req: Request<IM, HTTPServer<C>>) => {
    return new Promise<LoaderResults|undefined>(resolve => {
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
export function dispatcher(options: CookieOptions = { path: '/' }) {
  return async (res: Response<SR>) => {
    const resource = res.resource;
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
    return resource;
  } 
};
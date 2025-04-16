//modules
import { Readable } from 'node:stream';
import * as cookie from 'cookie';
//stackpress
import type { Method, UnknownNest } from '@stackpress/lib/types';
import { 
  isObject, 
  objectFromQuery, 
  formDataToObject 
} from '@stackpress/lib/Nest';
//common
import type { 
  Body,
  WhatwgServer,
  WhatwgAction,
  NodeRequest,
  NodeOptResponse,
  LoaderResults,
  CookieOptions
} from '../types.js';
import Route from '../Route.js';
import Request from '../Request.js';
import Response from '../Response.js';
//local
import { 
  WhatwgResponse,
  reqToURL,
  readableToReadableStream
} from './helpers.js';

export default class Adapter<C extends UnknownNest = UnknownNest> {
  /**
   * Server request handler
   */
  public static async plug<C extends UnknownNest = UnknownNest>(
    context: WhatwgServer<C>, 
    request: NodeRequest,
    action?: string|WhatwgAction<C>
  ) {
    const server = new Adapter(context, request);
    return server.plug(action);
  };

  //the parent server context
  protected _context: WhatwgServer<C>;
  //the native request
  protected _request: NodeRequest;

  /**
   * Sets up the server
   */
  constructor(context: WhatwgServer<C>, request: NodeRequest) {
    this._context = context;
    this._request = request;
  }

  /**
   * Handles the request
   */
  public async plug(action?: string|WhatwgAction<C>) {
    //initialize the request
    const req = this.request();
    const res = this.response();
    //determine event name
    const event = action || `${req.method} ${req.url.pathname}`;
    //load the body
    await req.load();
    //hook the plugins
    await Route.emit<C, NodeRequest, NodeOptResponse>(
      event, 
      req, 
      res, 
      this._context
    );
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
    //set resource
    const resource = this._request;
    //set method
    const method = (this._request.method?.toUpperCase() || 'GET') as Method;
    //set the type
    const mimetype = this._request.headers.get('content-type') || 'text/plain';
    //set the headers
    const headers: Record<string, string|string[]> = {};
    this._request.headers.forEach((value, key) => {
      if (typeof value !== 'undefined') {
        headers[key] = value;
      }
    });
    //set session
    const session = cookie.parse(
      this._request.headers.get('cookie') as string || ''
    ) as Record<string, string>;
    //set url
    const url = reqToURL(this._request);
    //set query
    const query = objectFromQuery(url.searchParams.toString());
    //setup the payload
    const request = new Request<NodeRequest>({
      resource,
      headers,
      method,
      mimetype,
      query,
      session,
      url
    });
    request.loader = loader(this._request);
    return request;
  }

  /**
   * Sets up the response
   */
  public response() {
    const response = new Response<NodeOptResponse>();
    response.dispatcher = dispatcher(
      this._context.config<CookieOptions>('cookie') || { path: '/' }
    );
    return response;
  }
};

/**
 * Request body loader
 */
export function loader(
  resource: NodeRequest
) {
  return async (req: Request<NodeRequest>) => {
    //if the body is cached
    if (req.body !== null) {
      return undefined;
    }
    //TODO: limit the size of the body
    const body = await resource.text();
    const post = formDataToObject(req.type, body)

    return { body, post } as LoaderResults;
  } 
};

/**
 * Maps out an Ingest Response to a Whatwg Response
 */
export function dispatcher(options: CookieOptions = { path: '/' }) {
  return async (res: Response<NodeOptResponse>) => {
    //fetch type responses dont start with a resource
    //so if it magically has a resource, then it must 
    //have been set in a route. So we can just return it.
    if (res.resource instanceof WhatwgResponse) {
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
    } else if (isObject(res.body) || Array.isArray(res.body)) {
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
    const resource = new WhatwgResponse(body, {
      status: res.code,
      statusText: res.status
    });
    //write cookies
    for (const [name, entry] of res.session.revisions.entries()) {
      if (entry.action === 'remove') {
        resource.headers.set(
          'Set-Cookie', 
          cookie.serialize(name, '', { ...options, expires: new Date(0) })
        );
      } else if (entry.action === 'set' 
        && typeof entry.value !== 'undefined'
      ) {
        const { value } = entry;
        const values = Array.isArray(value) ? value : [ value ];
        for (const value of values) {
          resource.headers.set(
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
        resource.headers.set(name, value);
      }
    }
    //set content type
    if (mimetype) {
      resource.headers.set('Content-Type', mimetype);
    }
    return resource;
  };
};
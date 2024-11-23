//modules
import * as cookie from 'cookie';
//stackpress
import type { Method } from '@stackpress/types/dist/types';
import StatusCode from '@stackpress/types/dist/StatusCode';
//common
import type { IM, SR, CookieOptions, LoaderResponse } from '../../types';
import Request from '../../Request';
import Response from '../../Response';
import Exception from '../../Exception';
import { isHash, formDataToObject, objectFromQuery } from '../../helpers';
//local
import type { HTTPAction } from './types';
import Queue from './Queue';
import Router from './Router';
import { imToURL } from './helpers';

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
    res.dispatcher = dispatcher(sr, this._options);
    return { req, res };
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
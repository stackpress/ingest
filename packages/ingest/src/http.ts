//modules
import { Readable } from 'stream';
import * as cookie from 'cookie';
//local
import type { 
  IM, 
  SR,
  LoaderResults,
  CookieOptions
} from './types';
import type Request from './Request';
import type Response from './Response';
import Exception from './Exception';
import { 
  isHash,
  objectFromQuery, 
  withUnknownHost,
  formDataToObject
} from './helpers';

/**
 * Parsed query object
 */
export function imToURL(resource: IM) {
  const { url, headers } = resource;
  //determine protocol (by default https)
  let protocol = 'https';
  //if there is an x-forwarded-proto header
  const proto = headers['x-forwarded-proto'];
  if (proto?.length) {
    //then let's use that instead
    if (Array.isArray(proto)) {
      protocol = proto[0];
    } else {
      protocol = proto;
    }
    protocol = protocol.trim();
    // Note: X-Forwarded-Proto is normally only ever a
    //       single value, but this is to be safe.
    if (protocol.indexOf(',') !== -1) {
      protocol = protocol.substring(0, protocol.indexOf(',')).trim();
    }
  }
  //form the URL
  const uri = `${protocol}://${headers.host}${url || '/'}`;
  //try to create a URL object
  try {
    return new URL(uri);  
  } catch(e) {}
  //we need to return a URL object
  return new URL(withUnknownHost(url || '/'));
};

/**
 * Parsed URL query object
 */
export function imQueryToObject(resource: IM) {
  return objectFromQuery(imToURL(resource).searchParams.toString());
};

/**
 * Converts the WebAPI ReadableStream to NodeJS Readable
 */
export function readableStreamToReadable(stream: ReadableStream) {
  const reader = stream.getReader();
  return new Readable({
    async read(size) {
      const { done, value } = await reader.read();
      if (done) {
        this.push(null);
        return;
      }
      this.push(value);
    }
  });
};

/**
 * Request body loader
 */
export function loader(resource: IM, size = 0) {
  return (req: Request) => {
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

/**
 * Server request handler
 */
export async function handle() {};
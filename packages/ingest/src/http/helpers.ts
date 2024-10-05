import type { IM, SR } from './types';
import type { CookieOptions, LoaderResponse } from '../payload/types';

import cookie from 'cookie';
import Request from '../payload/Request';
import Response from '../payload/Response';
import { 
  isHash,
  objectFromJson, 
  objectFromQuery, 
  objectFromFormData,
  withUnknownHost
} from '../helpers';

import Exception from '../Exception';

export { 
  isHash,
  objectFromJson, 
  objectFromQuery, 
  objectFromFormData,
  withUnknownHost
};

/**
 * Returns the parsed form data from the request body (if any)
 */
export function formDataToObject(type: string, body: string) {
  return type.endsWith('/json') 
    ? objectFromJson(body)
    : type.endsWith('/x-www-form-urlencoded')
    ? objectFromQuery(body)
    : type === 'multipart/form-data'
    ? objectFromFormData(body)
    : {} as Record<string, unknown>;
};

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
        if (body.length > size) {
          throw Exception.for('Request exceeds %s', size);
        }
      });
      resource.on('end', () => {
        resolve({ body, post: formDataToObject(req.type, body) });
      });
    });
  } 
};

/**
 * Response dispatcher
 */
export function dispatcher(
  resource: SR, 
  options: CookieOptions = {}
) {
  return (res: Response) => {
    return new Promise<void>(resolve => {
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
          errors: res.errors.size > 0 ? res.errors.get() : undefined,
          total: res.total > 0 ? res.total : undefined
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
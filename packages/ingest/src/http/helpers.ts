import type { IncomingMessage, ServerResponse } from 'http';
import type { CookieOptions } from '../runtime/types';

import cookie from 'cookie';
import Request from '../payload/Request';
import Response from '../payload/Response';
import { 
  objectFromJson, 
  objectFromQuery, 
  objectFromFormData,
  withUnknownHost
} from '../runtime/helpers';

import Exception from '../Exception';

export type IM = IncomingMessage;
export type SR = ServerResponse<IncomingMessage>;

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
    return new Promise<void>(resolve => {
      //if the body is cached
      if (req.body !== null) {
        resolve();
      }
      //set the type
      req.type = resource.headers['content-type'] || 'text/plain';
      //set the headers
      Object.entries(resource.headers)
        .filter(([key, value]) => typeof value !== 'undefined')
        .forEach(([key, value]) => {
          req.headers.set(key, value as string|string[]);
        });
      //set session
      const session = cookie.parse(resource.headers.cookie as string || '');
      Object.entries(session).forEach(([key, value]) => {
        req.session.set(key, value);
      });

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
        //set body
        req.body = body;
        //set data
        req.data.set(Object.assign({},
          imQueryToObject(resource),
          resource.headers,
          Object.fromEntries(req.session),
          formDataToObject(req.type, req.body)
        ));
        resolve();
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
      for (const [ name, value ] of res.headers) {
        resource.setHeader(name, value);
      }
      //set content type
      resource.setHeader('Content-Type', res.type);
      //if body is a valid response
      if (typeof res.body === 'string' 
        || Buffer.isBuffer(res.body) 
        || res.body instanceof Uint8Array
      ) {
        resource.end(res.body);
      //if there even is a body
      } else if (typeof res.body !== 'undefined' && res.body !== null) {
        resource.end(res.body.toString());
      //by default we will send a JSON from the data
      } else {
        resource.setHeader('Content-Type', 'application/json');
        resource.end(JSON.stringify({
          code: res.code,
          status: res.status,
          results: res.data.size > 0 ? res.data.get() : undefined,
          errors: res.errors.size > 0 ? res.errors.get() : undefined,
          total: res.total > 0 ? res.total : undefined
        }));
      }
      resolve();
    });
  } 
};
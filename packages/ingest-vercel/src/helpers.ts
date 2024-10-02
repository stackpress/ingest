import type { Body, CookieOptions } from '@stackpress/ingest/dist/runtime/types';

import cookie from 'cookie';
import Request from '@stackpress/ingest/dist/payload/Request';
import Response from '@stackpress/ingest/dist/payload/Response';
import { 
  objectFromJson, 
  objectFromQuery, 
  objectFromFormData
} from '@stackpress/ingest/dist/runtime/helpers';

export type FetchRequest = globalThis.Request;
export type FetchResponse = globalThis.Response;
export const NativeRequest = global.Request;
export const NativeResponse = global.Response;

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
export function fetchToURL(resource: FetchRequest) {
  return new URL(resource.url); 
};

/**
 * Parsed URL query object
 */
export function fetchQueryToObject(resource: FetchRequest) {
  return objectFromQuery(fetchToURL(resource).searchParams.toString());
};

/**
 * Request body loader
 */
export function loader(resource: FetchRequest) {
  return (req: Request) => {
    return new Promise<void>(async resolve => {
      //if the body is cached
      if (req.body !== null) {
        resolve();
      }

      const { headers } = resource;

      //set the type
      req.type = headers.get('content-type') || 'text/plain';
      //set the headers
      headers.forEach((value, key) => {
        if (typeof value !== 'undefined') {
          req.headers.set(key, value);
        }
      });
      //set session
      const session = cookie.parse(
        headers.get('cookie') as string || ''
      );
      Object.entries(session).forEach(([key, value]) => {
        req.session.set(key, value);
      });

      req.body = await resource.text();

      //set data
      req.data.set(Object.assign({},
        fetchQueryToObject(resource),
        Object.fromEntries(req.headers.entries()),
        req.session.data,
        formDataToObject(req.type, req.body)
      ));

      resolve();
    });
  } 
};

/**
 * Maps out an Ingest Response to a Fetch Response
 */
export async function response(res: Response, options: CookieOptions = {}) {
  let type = res.type;
  let body: Body|null = null;
  //if body is a valid response
  if (typeof res.body === 'string' 
    || Buffer.isBuffer(res.body) 
    || res.body instanceof Uint8Array
  ) {
    body = res.body;
  //if there even is a body
  } else if (typeof res.body !== 'undefined' && res.body !== null) {
    body = res.body.toString();
  //by default we will send a JSON from the data
  } else {
    type = 'application/json';
    body = JSON.stringify({
      code: res.code,
      status: res.status,
      results: res.data.size > 0 ? res.data.get() : undefined,
      errors: res.errors.size > 0 ? res.errors.get() : undefined,
      total: res.total > 0 ? res.total : undefined
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
  for (const [ name, value ] of res.headers) {
    const values = Array.isArray(value) ? value : [ value ];
    for (const value of values) {
      response.headers.set(name, value);
    }
  }
  //set content type
  response.headers.set('Content-Type', type);
  return response;
}
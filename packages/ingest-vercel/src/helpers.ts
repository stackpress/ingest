import type { 
  Body,
  CookieOptions, 
  LoaderResponse
} from '@stackpress/ingest/dist/payload/types';

import cookie from 'cookie';
import Request from '@stackpress/ingest/dist/payload/Request';
import Response from '@stackpress/ingest/dist/payload/Response';
import { 
  isHash,
  objectFromJson, 
  objectFromQuery, 
  objectFromFormData
} from '@stackpress/ingest/dist/helpers';
import type { FetchRequest } from './types';


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
export async function response(res: Response, options: CookieOptions = {}) {
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
      errors: res.errors.size > 0 ? res.errors.get() : undefined,
      total: res.total > 0 ? res.total : undefined
    });
  } else if (res.code && res.status) {
    res.mimetype = 'application/json';
    body = JSON.stringify({
      code: res.code,
      status: res.status,
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
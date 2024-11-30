//modules
import { Readable } from 'stream';
import * as cookie from 'cookie';
//local
import type { 
  Body,
  FetchRequest,
  LoaderResults,
  CookieOptions,
} from './types';
import type Request from './Request';
import type Response from './Response';
import { 
  isHash,
  objectFromQuery,
  formDataToObject
} from './helpers';

export const NativeRequest = global.Request;
export const NativeResponse = global.Response;

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
 * Converts the NodeJS Readable to a WebAPI ReadableStream
 */
export function readableToReadableStream(stream: Readable) {
  return new ReadableStream({
    start(controller) {
      stream.on('data', chunk => controller.enqueue(chunk));
      stream.on('end', () => controller.close());
    }
  });
};

/**
 * Request body loader
 */
export function loader(resource: FetchRequest, size = 0) {
  return (req: Request) => {
    return new Promise<LoaderResults|undefined>(async resolve => {
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

/**
 * Server request handler
 */
export async function handle() {};
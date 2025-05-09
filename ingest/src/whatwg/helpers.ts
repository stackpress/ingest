//modules
import { Readable } from 'node:stream';
//local
import type { NodeRequest } from '../types.js';
import { objectFromQuery } from '../helpers.js';

export const WhatwgRequest = global.Request;
export const WhatwgResponse = global.Response;

/**
 * Parsed query object
 */
export function reqToURL(resource: NodeRequest) {
  let url = new URL(resource.url);
  //replace // with /
  url.pathname = url.pathname.replaceAll('//', '/');
  //also remove any trailing slashes
  if (url.pathname.endsWith('/')) {
    url.pathname = url.pathname.slice(0, -1);
  }
  return url; 
};

/**
 * Parsed URL query object
 */
export function reqQueryToObject(resource: NodeRequest) {
  return objectFromQuery(reqToURL(resource).searchParams.toString());
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
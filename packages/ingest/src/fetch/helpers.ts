//modules
import { Readable } from 'node:stream';
//local
import type { NodeRequest } from '../types';
import { objectFromQuery } from '../helpers';

export const NativeRequest = global.Request;
export const NativeResponse = global.Response;

/**
 * Parsed query object
 */
export function fetchToURL(resource: NodeRequest) {
  return new URL(resource.url); 
};

/**
 * Parsed URL query object
 */
export function fetchQueryToObject(resource: NodeRequest) {
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
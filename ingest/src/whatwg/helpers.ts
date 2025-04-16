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
  return new URL(resource.url); 
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
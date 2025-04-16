//node
import type { TLSSocket } from 'node:tls';
import { Readable } from 'node:stream';
//stackpress
import { objectFromQuery } from '@stackpress/lib/Nest';
import { withUnknownHost } from '@stackpress/lib/Request';
//common
import type { IM } from '../types.js';

/**
 * Parsed query object
 */
export function imToURL(resource: IM) {
  const { url, headers } = resource;
  //determine protocol (by default https)
  let protocol = (
    resource.socket as TLSSocket
  ).encrypted ? 'https' : 'http';
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
    async read(_size) {
      const { done, value } = await reader.read();
      if (done) {
        this.push(null);
        return;
      }
      this.push(value);
    }
  });
};
//common
import type { FetchRequest } from '../../types';
import { objectFromQuery } from '../../helpers';

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
import Nest from '../payload/Nest';

/**
 * Returns true if the value is a native JS object
 */
export function isHash(value: unknown) {
  return typeof value === 'object' && value?.constructor.name === 'Object';
};

/**
 * Transform query string into object
 * This is usually from URL.search or 
 * body application/x-www-form-urlencoded
 */
export function objectFromQuery(query: string) {
  if (query) {
    const nest = new Nest();
    nest.withQuery.set(query);
    return nest.get() as Record<string, unknown>;
  }
  return {} as Record<string, unknown>;
};

/**
 * Transform form data into object
 * This is usually from body multipart/form-data
 */
export function objectFromFormData(data: string) {
  if (data) {
    const nest = new Nest();
    nest.withFormData.set(data);
    return nest.get() as Record<string, unknown>;
  }
  return {} as Record<string, unknown>;
};

/**
 * Transform JSON string into object
 * This is usually from body application/json
 * or text/json
 */
export function objectFromJson(json: string) {
  if (json.startsWith('{')) {
    return JSON.parse(json) as Record<string, unknown>;
  }
  return {} as Record<string, unknown>;
};

/**
 * Adds a default host to invalid URLs
 */
export function withUnknownHost(url: string) {
  if (url.indexOf('/') !== 0) {
    url = '/' + url;
  }

  return `http://unknownhost${url}`;
};
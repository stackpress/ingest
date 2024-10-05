import type { ActionCallback } from './event/types';
import type Event from './event/Event';
import type Request from './payload/Request';
import type Response from './payload/Response';
import Nest from './payload/Nest';

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
 * Extracts the route parameters from the URL
 */
export function routeParams(route: string, pathname: string) {
  const args: string[] = [];
  const params: Record<string, string> = {};

  //convert route to a regex pattern
  const pattern = `^${route}$`
    //replace the :variable-_name01
    .replace(/(\:[a-zA-Z0-9\-_]+)/g, '*')
    //replace the stars
    //* -> ([^/]+)
    //@ts-ignore Property 'replaceAll' does not exist on type 'string'
    //but it does exist according to MDN...
    .replaceAll('*', '([^/]+)')
    //** -> ([^/]+)([^/]+) -> (.*)
    .replaceAll('([^/]+)([^/]+)', '(.*)');

  //find all the matches
  const matches = Array.from(pathname.matchAll(new RegExp(pattern, 'g')));
  //if no matches
  if (!Array.isArray(matches[0]) || !matches[0].length) {
    return { args, params };
  }

  //find and organize all the dynamic parameters for mapping
  const map = Array.from(
    route.matchAll(/(\:[a-zA-Z0-9\-_]+)|(\*\*)|(\*)/g)
  ).map(match => match[0]);
  //loop through the matches
  matches[0].slice().forEach((param, i) => {
    //skip the first one (GET)
    if (!i) {
      return;
    }

    //so matches will look like
    // [ '/foo/bar', 'foo', 'bar' ]
    //and map will look like
    // [ ':foo', ':bar' ]

    //if it's a * param
    if (typeof map[i - 1] !== 'string' 
      || map[i - 1].indexOf('*') === 0
    ) {
      //if no / in param
      if (param.indexOf('/') === -1) {
        //single push
        return args.push(param);
      }

      //push multiple values
      return Array.prototype.push.apply(args, param.split('/'));
    }

    //if it's a :parameter
    if (typeof map[i - 1] === 'string') {
      params[map[i - 1].substring(1)] = param;
    }
  });
  return { args, params };
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

/**
 * Basic task wrapper
 */
export function task(runner: (
  req: Request, 
  res: Response, 
  ctx: Event<ActionCallback>
) => void) {
  return runner;
};
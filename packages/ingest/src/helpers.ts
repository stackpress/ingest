//stackpress
import Nest from '@stackpress/lib/dist/data/Nest';

/**
 * Returns true if the value is a native JS object
 */
export function isHash(value: unknown) {
  return typeof value === 'object' && value?.constructor?.name === 'Object';
};

/**
 * Returns the parsed form data from the request body (if any)
 */
export function formDataToObject(type: string, body: string) {
  return type.endsWith('/json') 
    ? objectFromJson(body)
    : type.endsWith('/x-www-form-urlencoded')
    ? objectFromQuery(body)
    : type.startsWith('multipart/form-data')
    ? objectFromFormData(body)
    : {} as Record<string, unknown>;
};

/**
 * Transform query string into object
 * This is usually from URL.search or 
 * body application/x-www-form-urlencoded
 */
export function objectFromQuery(query: string) {
  if (query.startsWith('?')) {
    query = query.substring(1);
  }
  if (query) {
    const nest = new Nest();
    nest.withQuery.set(query);
    return nest.get();
  }
  return {};
};

/**
 * Transform form data into object
 * This is usually from body multipart/form-data
 */
export function objectFromFormData(data: string) {
  if (data) {
    const nest = new Nest();
    nest.withFormData.set(data);
    return nest.get();
  }
  return {};
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
export function eventParams(pattern: string, event: string) {
  const regexp = new RegExp(
    // pattern,
    pattern.substring(
      pattern.indexOf('/') + 1,
      pattern.lastIndexOf('/')
    ),
    // flag
    pattern.substring(
      pattern.lastIndexOf('/') + 1
    )
  );

  //because String.matchAll only works for global flags ...
  let match, parameters: string[];
  if (regexp.flags.indexOf('g') === -1) {
    match = event.match(regexp);
    if (!match || !match.length) {
      return;
    }

    parameters = [];
    if (Array.isArray(match)) {
      parameters = match.slice();
      parameters.shift();
    }
  } else {
    match = Array.from(event.matchAll(regexp));
    if (!Array.isArray(match[0]) || !match[0].length) {
      return;
    }

    parameters = match[0].slice();
    parameters.shift();
  }
  return parameters;
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


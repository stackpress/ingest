import type { CallableMap, CallableSet } from '@stackpress/types/dist/types';
import type { ContextInitializer } from './types';
import type Request from './Request';

import { map, set } from '@stackpress/types/dist/helpers';
import { isHash } from './helpers';

export default class RequestContext {
  //request
  public readonly request: Request;
  //context args
  public readonly args: CallableSet<string>;
  //context params
  public readonly params: CallableMap<string, string>;

  /**
   * Returns the body
   */
  public get body() {
    return this.request.body;
  }

  /**
   * Returns the request data
   */
  public get data() {
    return this.request.data;
  }

  /**
   * Returns the request headers
   */
  public get headers() {
    return this.request.headers;
  }

  /**
   * Returns whether if the body was loaded
   */
  public get loaded() {
    return this.request.loaded;
  }

  /**
   * Returns the request method
   */
  public get method() {
    return this.request.method;
  }

  /**
   * Returns the request body mimetype
   */
  public get mimetype() {
    return this.request.mimetype;
  }

  /**
   * Returns the request post
   */
  public get post() {
    return this.request.post;
  }

  /**
   * Returns the request query
   */
  public get query() {
    return this.request.query;
  }

  /**
   * Returns the request session
   */
  public get session() {
    return this.request.session;
  }

  /**
   * Returns the type of body
   * string|Buffer|Uint8Array|Record<string, unknown>|Array<unknown>
   */
  public get type() {
    return this.request.type;
  }

  /**
   * Returns the request url
   */
  public get url() {
    return this.request.url;
  }

  /**
   * Sets the request and the context initializer
   */
  constructor(request: Request, init: ContextInitializer = {}) {
    this.request = request;
    this.args = set(
      init.args instanceof Set
        ? Array.from(init.args.values())
        : Array.isArray(init.args)
        ? init.args
        : undefined
    );
    this.params = map<string, string>(
      init.params instanceof Map
        ? Array.from(init.params.entries())
        : isHash(init.params)
        ? Object.entries(init.params as Record<string, string>)
        : undefined
    );
    
    this.params.forEach((value, key) => {
      //only add if it doesn't exist
      !this.data.has(key) && this.data.set(key, value);
    });
  }
}
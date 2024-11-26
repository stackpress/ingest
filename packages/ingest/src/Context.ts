import type { 
  Method, 
  CallableMap, 
  CallableNest,
  CallableSet
} from '@stackpress/types/dist/types';
import type { ContextInitializer, CallableSession } from './types';
import type Request from './Request';

import { map, set } from '@stackpress/types/dist/helpers';
import { isHash } from './helpers';

export default class RequestContext<R = unknown> {
  //request
  public readonly request: Request<R>;
  //context args
  public readonly args: CallableSet<string>;
  //context params
  public readonly params: CallableMap<string, string>;
  //These link to request properties
  //query controller
  public readonly data: CallableNest;
  //request method
  public readonly method: Method;
  //head controller
  public readonly headers: CallableMap<string, string|string[]>;
  //query controller
  public readonly query: CallableNest;
  //session controller
  public readonly session: CallableSession;
  //url controller
  public readonly url = new URL('http://unknownhost/');

  /**
   * Returns the body
   */
  public get body() {
    return this.request.body;
  }

  /**
   * Returns whether if the body was loaded
   */
  public get loaded() {
    return this.request.loaded;
  }

  /**
   * Returns the request body mimetype
   */
  public get mimetype() {
    return this.request.mimetype;
  }

  /**
   * Returns the post
   */
  public get post() {
    return this.request.post;
  }

  /**
   * Returns the type of body
   * string|Buffer|Uint8Array|Record<string, unknown>|Array<unknown>
   */
  public get type() {
    return this.request.type;
  }

  /**
   * Sets the request and the context initializer
   */
  constructor(request: Request<R>, init: ContextInitializer = {}) {
    this.request = request;
    //pass by reference
    this.method = request.method;
    this.data = request.data;
    this.headers = request.headers;
    this.query = request.query;
    this.session = request.session;
    this.url = request.url;

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
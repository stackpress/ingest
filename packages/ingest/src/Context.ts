import type { Method } from '@stackpress/types/dist/types';
import type { ContextInitializer } from './types';
import type Request from './Request';

import Nest from '@stackpress/types/dist/Nest';
import ReadonlyMap from '@stackpress/types/dist/readonly/Map';
import ReadonlySet from '@stackpress/types/dist/readonly/Set';
import ReadonlyNest from '@stackpress/types/dist/readonly/Nest';
import { ReadSession } from './Session';
import { isHash } from './helpers';

export default class RequestContext<R = unknown> {
  //request
  public readonly request: Request<R>;
  //context args
  public readonly args: ReadonlySet<string>;
  //context params
  public readonly params: ReadonlyMap<string, string>;
  //These link to request properties
  //query controller
  public readonly data: Nest;
  //request method
  public readonly method: Method;
  //head controller
  public readonly headers: ReadonlyMap<string, string|string[]>;
  //query controller
  public readonly query: ReadonlyNest;
  //session controller
  public readonly session = new ReadSession();
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
    this.method = request.method;
    this.data = request.data;
    this.headers = request.headers;
    this.query = request.query;
    this.session = request.session;
    this.url = request.url;

    if (init.args instanceof Set) {
      this.args = new ReadonlySet(Array.from(init.args.values()));
    } else if (Array.isArray(init.args)) {
      this.args = new ReadonlySet(init.args);
    } else {
      this.args = new ReadonlySet();
    }
    if (init.params instanceof Map) {
      this.params = new ReadonlyMap(Array.from(init.params.entries()));
    } else if (isHash(init.params)) {
      const params = init.params as Record<string, string>;
      this.params = new ReadonlyMap(Object.entries(params));
    } else {
      this.params = new ReadonlyMap();
    }
    this.params.forEach((value, key) => {
      //only add if it doesn't exist
      !this.data.has(key) && this.data.set(key, value);
    });
  }
}
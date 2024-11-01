import type { Method } from '@stackpress/types/dist/types';
import type { Body, RequestLoader, RequestInitializer } from './types';

import cookie from 'cookie';
import Nest from '@stackpress/types/dist/Nest';
import ReadonlyMap from '@stackpress/types/dist/readonly/Map';
import ReadonlyNest from '@stackpress/types/dist/readonly/Nest';

import { 
  isHash, 
  objectFromQuery, 
  eventParams, 
  routeParams 
} from '../helpers';
import Context from './Context';
import { ReadSession } from './Session';

export default class Request<T = unknown> {
  //query controller
  public readonly data: Nest;
  //head controller
  public readonly headers: ReadonlyMap<string, string|string[]>;
  //query controller
  public readonly query: ReadonlyNest;
  //session controller
  public readonly session = new ReadSession();
  //url controller
  public readonly url = new URL('http://unknownhost/');
  //request method
  public readonly method: Method;
  //payload body
  protected _body: Body|null;
  //body mimetype
  protected _mimetype: string;
  //whether if the body was loaded
  protected _loaded = false;
  //body loader
  protected _loader?: RequestLoader;
  //post controller
  protected _post: ReadonlyNest;
  //resource
  protected _resource?: T;

  /**
   * Returns the body
   */
  public get body() {
    return typeof this._body !== 'undefined' ? this._body : null;
  }

  /**
   * Returns whether if the body was loaded
   */
  public get loaded() {
    return this._loaded;
  }

  /**
   * Returns the request body mimetype
   */
  public get mimetype() {
    return this._mimetype;
  }

  /**
   * Returns the post
   */
  public get post() {
    return this._post;
  }

  /**
   * Returns the original resource
   */
  public get resource() {
    return this._resource;
  }

  /**
   * Returns the type of body
   * string|Buffer|Uint8Array|Record<string, unknown>|Array<unknown>
   */
  public get type() {
    if (this._body instanceof Buffer) {
      return 'buffer';
    } else if (this._body instanceof Uint8Array) {
      return 'uint8array';
    } else if (isHash(this._body)) {
      return 'object';
    } else if (Array.isArray(this._body)) {
      return 'array';
    } else if (typeof this._body === 'string') {
      return 'string';
    } else if (this._body === null) {
      return 'null';
    }
    return typeof this._body;
  }

  /**
   * Sets Loader
   */
  public set loader(loader: RequestLoader) {
    this._loader = loader;
  }

  /**
   * Sets request defaults
   */
  public constructor(init: RequestInitializer<T> = {}) {
    this.method = init.method || 'GET';
    this._mimetype = init.mimetype || 'text/plain';
    this._body = init.body || null;
    if (init.headers instanceof Map) {
      this.headers = new ReadonlyMap<string, string|string[]>(
        Array.from(init.headers.entries())
      );
    } else if (isHash(init.headers)) {
      this.headers = new ReadonlyMap<string, string|string[]>(
        Object.entries(init.headers as Record<string, string|string[]>)
      );
    } else {
      this.headers = new ReadonlyMap<string, string|string[]>();
    }

    if (init.url instanceof URL) {
      this.url = init.url;
    } else if (typeof init.url === 'string') {
      this.url = new URL(init.url);
    } else {
      this.url = new URL('http://unknownhost/');
    }

    if (init.data instanceof Map) {
      this.data = new Nest(Object.fromEntries(init.data));
    } else if (isHash(init.data)) {
      this.data = new Nest(init.data);
    } else {
      this.data = new Nest();
    }

    if (typeof init.query === 'string') {
      this.query = new ReadonlyNest(objectFromQuery(init.query));
    } else if (init.query instanceof Map) {
      this.query = new ReadonlyNest(Object.fromEntries(init.query));
    } else if (isHash(init.query)) {
      this.query = new ReadonlyNest(init.query);
    } else {
      this.query = new ReadonlyNest(
        Object.fromEntries(this.url.searchParams.entries())
      );
    }

    if (init.session instanceof Map) {
      this.session = new ReadSession(
        Array.from(init.session.entries())
      );
    } else if (isHash(init.session)) {
      this.session = new ReadSession(
        Object.entries(init.session as Record<string, string|string[]>)
      );
    } else if (this.headers.has('cookie')) {
      this.session = new ReadSession(
        Object.entries(
          cookie.parse(this.headers.get('cookie') as string)
        ).filter(
          ([ key, value ]) => typeof value !== 'undefined'
        ) as [string, string][]
      );
    } else {
      this.session = new ReadSession();
    }

    if (init.post instanceof Map) {
      this._post = new ReadonlyNest(Object.fromEntries(init.post));
    } else if (isHash(init.post)) {
      this._post = new ReadonlyNest(init.post);
    } else {
      this._post = new ReadonlyNest();
    }

    if (init.resource) {
      this._resource = init.resource;
    }
  }

  /**
   * Returns a new request context with pattern
   */
  public ctxFromPattern(pattern: string|RegExp) {
    const args = eventParams(pattern.toString(), this.url.pathname);
    return new Context(this, { args });
  }

  /**
   * Returns a new request context with route
   */
  public ctxFromRoute(route: string) {
    const { args, params } = routeParams(route, this.url.pathname);
    return new Context(this, { args, params });
  }

  /**
   * Loads the body
   */
  public async load() {
    //if it's already loaded, return
    if (this._loaded) {
      return this;
    }
    //if there is a loader is a function, use that
    if (typeof this._loader === 'function') {
      const data = await this._loader(this);
      if (data) {
        if (data.body) {
          this._body = data.body;
        }
        if (data.post instanceof Map) {
          this._post = new ReadonlyNest(
            Object.fromEntries(Object.entries(data.post))
          );
        } else if (isHash(data.post)) {
          this._post = new ReadonlyNest(data.post);
        }
      }
    }
    //flag as loaded
    this._loaded = true;
    return this;
  }
}
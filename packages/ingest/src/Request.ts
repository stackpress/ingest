import type { CallableMap, CallableNest } from '@stackpress/types/dist/types';
import type { Method } from '@stackpress/types/dist/types';
import type { 
  Body,
  CallableSession,
  RequestLoader, 
  RequestInitializer 
} from './types';

import * as cookie from 'cookie';
import { nest } from '@stackpress/types/dist/Nest';
import { map } from '@stackpress/types/dist/helpers';

import { 
  isHash, 
  objectFromQuery, 
  eventParams, 
  routeParams
} from './helpers';
import Context from './Context';
import { session } from './Session';

export default class Request<R = unknown> {
  //data controller
  public readonly data: CallableNest;
  //head controller
  public readonly headers: CallableMap<string, string|string[]>;
  //query controller
  public readonly query: CallableNest;
  //post controller
  public readonly post: CallableNest;
  //session controller
  public readonly session: CallableSession;
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
  protected _loader?: RequestLoader<R>;
  //original request resource
  protected _resource?: R;

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
   * Returns the original resource
   */
  public get resource() {
    return this._resource;
  }

  /**
   * Returns the type of body
   * ie. string|Buffer|Uint8Array|Record<string, unknown>|Array<unknown>
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
  public set loader(loader: RequestLoader<R>) {
    this._loader = loader;
  }

  /**
   * Sets request defaults
   */
  public constructor(init: RequestInitializer<R> = {}) {
    this.data = nest();
    this.url = init.url instanceof URL ? init.url
      : typeof init.url === 'string' ? new URL(init.url)
      : new URL('http://unknownhost/');
    this.headers = map(
      init.headers instanceof Map
        ? Array.from(init.headers.entries())
        : isHash(init.headers)
        ? Object.entries(init.headers as Record<string, string|string[]>)
        : undefined
    );
    this.session = session(
      init.session instanceof Map
        ? Array.from(init.session.entries())
        : isHash(init.session)
        ? Object.entries(init.session as Record<string, string|string[]>)
        : this.headers.has('cookie')
        ? Object.entries(
          cookie.parse(this.headers.get('cookie') as string)
        ).filter(
          ([ key, value ]) => typeof value !== 'undefined'
        ) as [string, string][]
        : undefined
    );
    this.query = nest(
      typeof init.query === 'string'
        ? objectFromQuery(init.query)
        : init.query instanceof Map
        ? Object.fromEntries(init.query)
        : isHash(init.query)
        ? init.query
        : this.url.search
        ? objectFromQuery(this.url.search)
        : Object.fromEntries(this.url.searchParams.entries())
    );
    this.post = nest(
      init.post instanceof Map
        ? Object.fromEntries(init.post)
        : isHash(init.post)
        ? init.post
        : undefined
    );

    this.method = init.method || 'GET';
    this._body = init.body || null;
    this._mimetype = init.mimetype || 'text/plain';
    
    if (this.query.size) {
      this.data.set(this.query.get());
    }
    if (this.post.size) {
      this.data.set(this.post.get());
    }
    if (init.data instanceof Map) {
      this.data.set(Object.fromEntries(init.data));
    } else if (isHash(init.data)) {
      this.data.set(init.data);
    }

    if (init.resource) {
      this._resource = init.resource;
    }
  }

  /**
   * Returns a new request context with pattern
   * ie. req.fromPattern(/foo/)
   * ie. req.fromPattern('/foo/')
   */
  public fromPattern(pattern: string|RegExp) {
    const args = eventParams(pattern.toString(), this.url.pathname);
    return new Context<R>(this, { args });
  }

  /**
   * Returns a new request context with route
   * ie. req.fromRoute('/foo/:bar')
   */
  public fromRoute(route: string) {
    const { args, params } = routeParams(route, this.url.pathname);
    return new Context<R>(this, { args, params });
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
          const post = Object.fromEntries(Object.entries(data.post));
          this.post.set(post);
          this.data.set(post);
        } else if (isHash(data.post)) {
          this.post.set(data.post);
          this.data.set(data.post);
        }
      }
    }
    //flag as loaded
    this._loaded = true;
    return this;
  }
}
import type { RequestLoader, RequestInitializer } from './types';

import cookie from 'cookie';

import { isHash, objectFromQuery } from '../helpers';

import Payload from './Payload';
import ReadonlyNest from './readonly/Nest';
import { ReadSession } from './Session';

export default class Request<T = unknown> extends Payload {
  //query controller
  public readonly query: ReadonlyNest;
  //session controller
  public session = new ReadSession();
  //url controller
  public readonly url = new URL('http://unknownhost/');
  //whether if the body was loaded
  protected _loaded = false;
  //body loader
  protected _loader?: RequestLoader;
  //post controller
  protected _post: ReadonlyNest;
  //resource
  protected _resource?: unknown;

  /**
   * Returns whether if the body was loaded
   */
  public get loaded() {
    return this._loaded;
  }

  /**
   * Returns the post
   */
  public get post() {
    return this._post;
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
    super(init);
    if (init.resource) {
      this._resource = init.resource;
    }

    if (init.url instanceof URL) {
      this.url = init.url;
    } else if (typeof init.url === 'string') {
      this.url = new URL(init.url);
    } else {
      this.url = new URL('http://unknownhost/');
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
        Object.entries(cookie.parse(this.headers.get('cookie') as string))
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
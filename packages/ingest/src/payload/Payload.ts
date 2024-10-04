import type { Body, PayloadInitializer } from './types';

import ReadonlyMap from './readonly/Map';
import { isHash } from '../helpers';

export default class Payload {
  //head controller
  public readonly headers: ReadonlyMap<string, string|string[]>;
  //payload body
  protected _body: Body|null;
  //body mimetype
  protected _type: string;
  
  /**
   * Sets the initial values of the payload
   */
  constructor(init: PayloadInitializer = {}) {
    this._type = init.type || 'text/plain';
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
  }

  /**
   * Returns the body
   */
  public get body() {
    return typeof this._body !== 'undefined' ? this._body : null;
  }

  /**
   * Returns the request body mimetype
   */
  public get type() {
    return this._type;
  }
}
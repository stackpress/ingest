import type { Body } from '../runtime/types';

import Nest from './Nest';

export default class Payload {
  //request body
  protected _body?: Body|null;
  //data controller
  protected _data = new Nest();
  //head controller
  protected _headers = new Map<string, string|string[]>();
  //response mimetype
  protected _type = 'plain/text';

  /**
   * Returns the body
   */
  public get body() {
    return typeof this._body !== 'undefined' ? this._body : null;
  }

  /**
   * Returns the data controller
   */
  public get data() {
    return this._data;
  }

  /**
   * Returns the head controller
   */
  public get headers() {
    return this._headers;
  }

  /**
   * Returns the request body mimetype
   */
  public get type() {
    return this._type;
  }

  /**
   * Manually sets the body
   */
  public set body(value: Body|null) {
    this._body = value;
  }

  /**
   * Manually sets the request body mimetype
   */
  public set type(value: string) {
    this._type = value;
  }
}
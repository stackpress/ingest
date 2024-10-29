import type { Trace } from '@stackpress/types/dist/types';

import type { 
  Body, 
  ResponseDispatcher,
  ResponseInitializer
} from './types';

import Nest from '@stackpress/types/dist/Nest';

import { WriteSession } from './Session';
import { isHash } from '../helpers';

export default class Response<T = unknown> {
  //head controller
  public readonly headers: Map<string, string|string[]>;
  //session controller
  public readonly session = new WriteSession();
  //error controller
  public readonly errors = new Nest();
  //body mimetype
  protected _mimetype?: string;
  //payload body
  protected _body: Body|null;
  //response status code
  protected _code = 0;
  //response dispatcher
  protected _dispatcher?: ResponseDispatcher;
  //whether if the response was sent
  protected _sent = false;
  //stack trace
  protected _stack?: Trace[];
  //response status message
  protected _status = '';
  //total count of possible results
  protected _total = 0;
  //resource
  protected _resource?: T;

  /**
   * Returns the body
   */
  public get body() {
    return typeof this._body !== 'undefined' ? this._body : null;
  }

  /**
   * Returns the status code
   */
  public get code() {
    return this._code;
  }

  /**
   * Returns the original resource
   */
  public get resource() {
    return this._resource;
  }
  
  /**
   * Returns whether if the response was sent
   */
  public get sent() {
    return this._sent;
  }

  /**
   * Returns a stack trace if error
   */
  public get stack(): Trace[]|undefined {
    return this._stack;
  }

  /**
   * Returns the status message
   */
  public get status() {
    return this._status;
  }

  /**
   * Returns the total count of possible results
   */
  public get total() {
    return this._total;
  }

  /**
   * Returns the request body mimetype
   */
  public get mimetype(): string|undefined {
    return this._mimetype;
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
   * Manually sets the body
   */
  public set body(value: Body|null) {
    this._body = value;
  }

  /**
   * Manually sets the status code
   */
  public set code(code: number) {
    this._code = code;
  }

  /**
   * Sets Dispatcher
   */
  public set dispatcher(dispatcher: ResponseDispatcher) {
    this._dispatcher = dispatcher;
  }

  /**
   * Sets a stack trace
   */
  public set stack(stack: Trace[]) {
    this._stack = stack;
  }

  /**
   * Manually sets the status message
   */
  public set status(status: string) {
    this._status = status;
  }

  /**
   * Manually sets the total count of possible results
   */
  public set total(total: number) {
    this._total = total;
  }

  /**
   * Manually sets the request body mimetype
   */
  public set mimetype(value: string) {
    this._mimetype = value;
  }

  /**
   * Sets the initial values of the payload
   */
  constructor(init: ResponseInitializer<T> = {}) {
    this._mimetype = init.mimetype;
    this._body = init.body || null;
    if (init.headers instanceof Map) {
      this.headers = new Map<string, string|string[]>(
        Array.from(init.headers.entries())
      );
    } else if (isHash(init.headers)) {
      this.headers = new Map<string, string|string[]>(
        Object.entries(init.headers as Record<string, string|string[]>)
      );
    } else {
      this.headers = new Map<string, string|string[]>();
    }

    if (init.resource) {
      this._resource = init.resource;
    }
  }

  /**
   * Dispatches the response
   */
  public async dispatch() {
    //if it's already sent, return
    if (this._sent) {
      return this;
    }
    //if there is a loader is a function, use that
    if (typeof this._dispatcher === 'function') {
      await this._dispatcher(this);
    }
    //flag as sent
    this.stop();
    return this;
  }

  /**
   * Prevents the response from being sent
   */
  public stop() {
    this._sent = true;
    return this;
  }
}
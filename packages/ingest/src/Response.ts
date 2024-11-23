import type { 
  Status, 
  Trace, 
  NestedObject
} from '@stackpress/types/dist/types';
import type { 
  Body, 
  ResponseDispatcher,
  ResponseInitializer,
  ResponseErrorOptions
} from './types';

import Nest from '@stackpress/types/dist/Nest';
import { status } from '@stackpress/types/dist/StatusCode';

import { WriteSession } from './Session';
import { isHash } from './helpers';

export default class Response<T = unknown> {
  //head controller
  public readonly headers: Map<string, string|string[]>;
  //session controller
  public readonly session = new WriteSession();
  //error controller
  public readonly errors = new Nest<NestedObject<string|string[]>>();
  //payload body
  protected _body: Body|null;
  //response status code
  protected _code = 0;
  //response dispatcher
  protected _dispatcher?: ResponseDispatcher;
  //body error message
  protected _error?: string;
  //body mimetype
  protected _mimetype?: string;
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
   * Returns the error message
   */
  public get error(): string|undefined {
    return this._error;
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
  public get status(): string {
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
    this._status = status(code)?.status || '';
  }

  /**
   * Sets Dispatcher
   */
  public set dispatcher(dispatcher: ResponseDispatcher) {
    this._dispatcher = dispatcher;
  }

  /**
   * Manually sets the error message
   */
  public set error(error: string) {
    this._error = error;
  }

  /**
   * Sets a stack trace
   */
  public set stack(stack: Trace[]) {
    this._stack = stack;
  }

  /**
   * Sets a stack trace
   */
  public set status(status: Status) {
    this._code = status.code;
    this._status = status.status;
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
   * Redirect
   */
  public redirect(url: string, code = 302, status?: string) {
    //sets the status code and message
    this.setStatus(code, status);
    //set the header location
    this.headers.set('Location', url);
    return this;
  }

  /**
   * Sets the body with checks 
   */
  public setBody(type: string, body: Body, code = 200, status?: string) {
    //sets the status code and message
    this.setStatus(code, status);
    //set the mimetype
    this._mimetype = type;
    //set the body
    this._body = body;
    return this;
  }

  /**
   * Sets error message
   */
  public setError(
    error: string|ResponseErrorOptions, 
    errors: NestedObject<string|string[]> = {}, 
    stack: Trace[] = [],
    code = 400, 
    status?: string
  ) {
    if (typeof error !== 'string') {
      errors = error.errors || errors;
      stack = error.stack || stack;
      code = error.code || code;
      status = error.status || status;
      error = error.error;
    }
    //sets the status code and message
    this.setStatus(code, status);
    //set the error message
    this._error = error;
    this._stack = stack && stack.length > 0 ? stack : undefined;
    //set the errors
    this.errors.set(errors);
    return this;
  }

  /**
   * Sets the body as HTML with checks 
   */
  public setHTML(body: string, code = 200, status?: string) {
    return this.setBody('text/html', body, code, status);
  }

  /**
   * Sets the body as JSON with checks 
   */
  public setJSON(body: string|NestedObject, code = 200, status?: string) {
    if (typeof body !== 'string') {
      body = JSON.stringify(body, null, 2);
    }
    return this.setBody('text/json', body, code, status);
  }

  /**
   * Sets the body as Object with checks 
   */
  public setResults(body: NestedObject, code = 200, status?: string) {
    return this.setBody('text/json', body, code, status);
  }

  /**
   * Sets the body as Array with checks 
   */
  public setRows(
    body: NestedObject[], 
    total = 0, 
    code = 200, 
    status?: string
  ) {
    this._total = total;
    return this.setBody('text/json', body, code, status);
  }

  /**
   * Sets the status code and message
   */
  public setStatus(code: number, message?: string) {
    this._code = code;
    this._status = message || status(code)?.status || '';
    return this;
  }

  /**
   * Sets the body as XML with checks 
   */
  public setXML(body: string, code = 200, status?: string) {
    return this.setBody('text/xml', body, code, status);
  }

  /**
   * Prevents the response from being sent
   */
  public stop() {
    this._sent = true;
    return this;
  }
}
//stackpress
import type { 
  Trace, 
  NestedObject,
  CallableMap, 
  CallableNest,
  ResponseStatus,
  StatusResponse,
  ErrorResponse
} from '@stackpress/types/dist/types';
import map from '@stackpress/types/dist/data/map';
import { nest } from '@stackpress/types/dist/data/Nest';
import { getStatus } from '@stackpress/types/dist/Status';
//local
import type { 
  Body, 
  CallableSession,
  ResponseDispatcher,
  ResponseInitializer
} from './types';
import { session } from './Session';
import { isHash } from './helpers';

/**
 * Generic response wrapper that works with 
 * ServerResponse and WHATWG (Fetch) Response
 * 
 * - map to native resource using dispatcher()
 * - access to original response resource
 * - preconfigured response methods
 */
export default class Response<S = unknown> {
  //head controller
  public readonly headers: CallableMap<string, string|string[]>;
  //session controller
  public readonly session: CallableSession;
  //error controller
  public readonly errors: CallableNest<NestedObject<string|string[]>>;
  //payload body
  protected _body: Body|null;
  //response status code
  protected _code = 0;
  //response dispatcher
  protected _dispatcher?: ResponseDispatcher<S>;
  //body error message
  protected _error?: string;
  //body mimetype
  protected _mimetype?: string;
  //original request resource
  protected _resource?: S;
  //whether if the response was sent
  protected _sent = false;
  //stack trace
  protected _stack?: Trace[];
  //response status message
  protected _status = '';
  //total count of possible results
  protected _total = 0;

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
   * Returns the original resource
   */
  public get resource() {
    return this._resource as S;
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
    this._status = getStatus(code)?.status || '';
  }

  /**
   * Sets Dispatcher
   */
  public set dispatcher(dispatcher: ResponseDispatcher<S>) {
    this._dispatcher = dispatcher;
  }

  /**
   * Manually sets the error message
   */
  public set error(error: string) {
    this._error = error;
  }

  /**
   * Sets the resource
   */
  public set resource(resource: S) {
    this._resource = resource;
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
  public set status(status: ResponseStatus) {
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
  constructor(init: Partial<ResponseInitializer<S>> = {}) {
    this._mimetype = init.mimetype;
    this._body = init.body || null;
    this._resource = init.resource;
    this.errors = nest();
    this.session = session();
    this.headers = map<string, string | string[]>(
      init.headers instanceof Map
        ? Array.from(init.headers.entries())
        : isHash(init.headers)
        ? Object.entries(init.headers as Record<string, string|string[]>)
        : undefined
    );
  }

  /**
   * Dispatches the response
   */
  public async dispatch() {
    //if it's already sent, return
    if (!this._sent) {
      const resource = typeof this._dispatcher === 'function'
        ? await this._dispatcher(this)
        : this.resource;
      this._sent = true;
      return resource;
    }
    return this.resource;
  }

  /**
   * Merges a success response object into this response
   */
  public fromStatusResponse(response: Partial<StatusResponse>) {
    const {
      code,
      status,
      error,
      errors,
      stack,
      results,
      total
    } = response;
    if (code) {
      this._code = code;
    }
    if (status) {
      this._status = status;
    }
    if (error) {
      this._error = error;
    }
    if (errors) {
      this.errors.set(errors);
    }
    if (stack) {
      this._stack = stack;
    }
    if (results) {
      this._body = results;
    }
    if (total) {
      this._total = total;
    }
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
    error: string|ErrorResponse, 
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
    this._total = 1;
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
    this._status = message || getStatus(code)?.status || '';
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

  /**
   * Converts the response to a status response
   */
  public toStatusResponse(): Partial<StatusResponse> {
    return {
      code: this._code,
      status: this._status,
      error: this._error,
      errors: this.errors(),
      stack: this._stack,
      results: this._body,
      total: this._total
    };
  }
}